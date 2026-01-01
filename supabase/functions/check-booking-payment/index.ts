import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-BOOKING-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId } = await req.json();
    
    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    logStep("Checking payment for appointment", { appointmentId });

    // Authenticate the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseAnon.auth.getUser();
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    // Use service role for operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get appointment with quote
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select("*, quote:quotes(*)")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the user is the client
    if (appointment.client_id !== userData.user.id) {
      throw new Error("User is not the client for this appointment");
    }

    const quote = appointment.quote;
    if (!quote) {
      throw new Error("No quote associated with this appointment");
    }

    // If no PIX ID, payment hasn't been initiated
    if (!quote.pix_id) {
      logStep("No PIX payment initiated");
      return new Response(JSON.stringify({ status: "NO_PIX", paid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If already confirmed, return immediately
    if (quote.client_confirmed) {
      logStep("Payment already confirmed");
      return new Response(JSON.stringify({ 
        status: "PAID", 
        paid: true,
        appointmentId: appointment.id,
        conversationId: quote.conversation_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check PIX status with AbacatePay
    const abacatePayKey = Deno.env.get("ABACATEPAY_API_KEY");
    if (!abacatePayKey) {
      throw new Error("AbacatePay API key not configured");
    }

    logStep("Checking PIX status", { pixId: quote.pix_id });

    const pixResponse = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${quote.pix_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${abacatePayKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!pixResponse.ok) {
      const errorText = await pixResponse.text();
      logStep("Error checking PIX status", { error: errorText });
      throw new Error(`Failed to check PIX status: ${errorText}`);
    }

    const pixData = await pixResponse.json();
    const pixStatus = pixData.data?.status?.toUpperCase() || "PENDING";

    logStep("PIX status received", { status: pixStatus });

    // If payment is confirmed
    if (pixStatus === "PAID" && !quote.client_confirmed) {
      logStep("Payment confirmed, updating records");

      // Get client name
      const { data: clientProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("user_id", appointment.client_id)
        .single();

      const clientName = clientProfile?.full_name || "Cliente";

      // Update quote as confirmed
      const { error: quoteUpdateError } = await supabaseAdmin
        .from("quotes")
        .update({
          client_confirmed: true,
          client_confirmed_at: new Date().toISOString(),
        })
        .eq("id", quote.id);

      if (quoteUpdateError) {
        logStep("Error updating quote", { error: quoteUpdateError.message });
      }

      // Create wallet transaction for the professional
      const fee = quote.price * PLATFORM_FEE_RATE;
      const netAmount = quote.price - fee;

      const { error: transactionError } = await supabaseAdmin
        .from("wallet_transactions")
        .insert({
          user_id: quote.professional_id,
          quote_id: quote.id,
          type: "credit",
          amount: quote.price,
          fee,
          net_amount: netAmount,
          description: `Agendamento direto - ${quote.title}`,
          customer_name: clientName,
          status: "completed",
        });

      if (transactionError) {
        logStep("Error creating transaction", { error: transactionError.message });
      }

      // Send confirmation message in chat
      if (quote.conversation_id) {
        await supabaseAdmin.from("messages").insert({
          conversation_id: quote.conversation_id,
          sender_id: appointment.client_id,
          content: `✅ Pagamento confirmado! O agendamento foi finalizado com sucesso.`,
          message_type: "text",
        });
      }

      logStep("Payment processed successfully");

      return new Response(JSON.stringify({ 
        status: "PAID", 
        paid: true,
        appointmentId: appointment.id,
        conversationId: quote.conversation_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Return current status
    return new Response(JSON.stringify({ 
      status: pixStatus, 
      paid: false,
      expiresAt: quote.pix_expires_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error checking payment", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
