import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-BOOKING-CHECKOUT] ${step}${detailsStr}`);
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

    logStep("Starting checkout for appointment", { appointmentId });

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

    logStep("User authenticated", { userId: userData.user.id, email: userData.user.email });

    // Use service role to get appointment and quote details
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get appointment with quote details
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        service:services(title, price)
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      logStep("Appointment not found", { error: appointmentError?.message });
      throw new Error("Appointment not found");
    }

    logStep("Appointment found", { appointmentId, quoteId: appointment.quote_id });

    // Verify the user is the client for this appointment
    if (appointment.client_id !== userData.user.id) {
      throw new Error("User is not the client for this appointment");
    }

    // Get the associated quote
    if (!appointment.quote_id) {
      throw new Error("No quote associated with this appointment");
    }

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .select("*")
      .eq("id", appointment.quote_id)
      .single();

    if (quoteError || !quote) {
      throw new Error("Quote not found");
    }

    logStep("Quote found", { quoteId: quote.id, price: quote.price, status: quote.status });

    // Check if there's an existing valid PIX payment
    if (quote.pix_id && quote.pix_br_code && quote.pix_expires_at) {
      const expiresAt = new Date(quote.pix_expires_at);
      const now = new Date();
      
      // Check if PIX hasn't expired (with 5 min buffer)
      if (expiresAt.getTime() > now.getTime() + 5 * 60 * 1000) {
        logStep("Returning existing PIX payment", { 
          pixId: quote.pix_id, 
          expiresAt: quote.pix_expires_at 
        });

        return new Response(JSON.stringify({ 
          pixId: quote.pix_id,
          brCode: quote.pix_br_code,
          brCodeBase64: quote.pix_br_code_base64,
          amount: quote.price * 100,
          expiresAt: quote.pix_expires_at,
          title: quote.title,
          price: quote.price,
          appointmentId: appointment.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        logStep("Existing PIX expired, creating new one");
      }
    }

    // Get user profile for customer info
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone, cpf")
      .eq("user_id", userData.user.id)
      .single();

    // Validate CPF is present
    if (!userProfile?.cpf) {
      throw new Error("CPF não cadastrado. Por favor, atualize seu perfil com o CPF antes de realizar o pagamento.");
    }

    // Clean CPF (remove formatting)
    const cleanCpf = userProfile.cpf.replace(/\D/g, "");

    const abacatePayKey = Deno.env.get("ABACATEPAY_API_KEY");

    if (!abacatePayKey) {
      throw new Error("AbacatePay API key not configured");
    }

    logStep("AbacatePay initialized");

    // Create PIX QR Code directly with AbacatePay
    const pixPayload = {
      amount: Math.round(quote.price * 100), // Convert to cents
      expiresIn: 3600, // 1 hour expiration
      description: `${quote.title} - Agendamento direto`,
      customer: {
        name: userProfile?.full_name || "Cliente",
        email: userData.user.email,
        cellphone: userProfile?.phone || undefined,
        taxId: cleanCpf
      },
      metadata: {
        appointment_id: appointmentId,
        quote_id: quote.id,
        client_id: userData.user.id,
        professional_id: quote.professional_id,
        conversation_id: quote.conversation_id
      }
    };

    logStep("Creating PIX QR Code", { 
      amount: pixPayload.amount,
      customerEmail: userData.user.email
    });

    const pixResponse = await fetch("https://api.abacatepay.com/v1/pixQrCode/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${abacatePayKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pixPayload)
    });

    if (!pixResponse.ok) {
      const errorData = await pixResponse.text();
      logStep("AbacatePay PIX error", { status: pixResponse.status, error: errorData });
      throw new Error(`AbacatePay error: ${errorData}`);
    }

    const pixData = await pixResponse.json();
    
    logStep("PIX QR Code created successfully", { 
      pixId: pixData.data?.id,
      status: pixData.data?.status
    });

    // Save PIX data to quote for future reference
    const { error: updateError } = await supabaseAdmin
      .from("quotes")
      .update({
        pix_id: pixData.data?.id,
        pix_br_code: pixData.data?.brCode,
        pix_br_code_base64: pixData.data?.brCodeBase64,
        pix_expires_at: pixData.data?.expiresAt
      })
      .eq("id", quote.id);

    if (updateError) {
      logStep("Warning: Failed to save PIX data to quote", { error: updateError.message });
    } else {
      logStep("PIX data saved to quote");
    }

    return new Response(JSON.stringify({ 
      pixId: pixData.data?.id,
      brCode: pixData.data?.brCode,
      brCodeBase64: pixData.data?.brCodeBase64,
      amount: pixData.data?.amount,
      expiresAt: pixData.data?.expiresAt,
      title: quote.title,
      price: quote.price,
      appointmentId: appointment.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error creating booking checkout", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
