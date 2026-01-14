import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RELEASE-PAYMENT] ${step}${detailsStr}`);
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

    logStep("Starting payment release", { appointmentId });

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

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Use service role for database operations
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

    // Verify the user is the CLIENT for this appointment (only client can release payment)
    if (appointment.client_id !== userId) {
      throw new Error("Somente o cliente pode confirmar a conclusão e liberar o pagamento");
    }

    const quote = appointment.quote;
    if (!quote) {
      throw new Error("No quote associated with this appointment");
    }

    // Check if the service is completed
    if (appointment.status !== "completed") {
      throw new Error("O serviço precisa ser marcado como concluído pelo profissional primeiro");
    }

    logStep("Appointment status verified", { status: appointment.status, quoteId: quote.id });

    // Find the pending wallet transaction for this quote
    const { data: pendingTx, error: txError } = await supabaseAdmin
      .from("wallet_transactions")
      .select("*")
      .eq("quote_id", quote.id)
      .eq("type", "credit")
      .eq("status", "pending")
      .maybeSingle();

    if (txError) {
      logStep("Error finding pending transaction", { error: txError.message });
      throw new Error("Error checking payment status");
    }

    if (!pendingTx) {
      // Check if already completed
      const { data: completedTx } = await supabaseAdmin
        .from("wallet_transactions")
        .select("id")
        .eq("quote_id", quote.id)
        .eq("type", "credit")
        .eq("status", "completed")
        .maybeSingle();

      if (completedTx) {
        logStep("Payment already released", { transactionId: completedTx.id });
        return new Response(JSON.stringify({ 
          success: true, 
          alreadyReleased: true,
          message: "Pagamento já foi liberado anteriormente"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      throw new Error("Nenhum pagamento pendente encontrado para este agendamento");
    }

    logStep("Found pending transaction", { transactionId: pendingTx.id, amount: pendingTx.net_amount });

    // Release the payment - update status to completed
    const { error: updateError } = await supabaseAdmin
      .from("wallet_transactions")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    if (updateError) {
      logStep("Error releasing payment", { error: updateError.message });
      throw new Error("Failed to release payment");
    }

    // Mark quote as completed
    await supabaseAdmin
      .from("quotes")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    // Update appointment to show client has confirmed
    await supabaseAdmin
      .from("appointments")
      .update({
        client_confirmed: true,
      })
      .eq("id", appointmentId);

    // Create service history entry
    const { data: service } = await supabaseAdmin
      .from("services")
      .select("category")
      .eq("id", quote.service_id)
      .maybeSingle();

    await supabaseAdmin.from("service_history").insert({
      client_id: appointment.client_id,
      professional_id: appointment.professional_id,
      service_id: quote.service_id,
      quote_id: quote.id,
      appointment_id: appointmentId,
      service_title: quote.title,
      service_category: service?.category || null,
      amount_paid: quote.price,
      status: "completed",
    });

    // Send notification to professional
    await supabaseAdmin.from("notifications").insert({
      user_id: appointment.professional_id,
      type: "payment_released",
      title: "Pagamento liberado!",
      message: `O cliente confirmou a conclusão do serviço "${quote.title}". O pagamento de R$ ${pendingTx.net_amount.toFixed(2).replace(".", ",")} foi creditado em sua carteira.`,
      data: { 
        appointment_id: appointmentId,
        quote_id: quote.id,
        amount: pendingTx.net_amount 
      },
    });

    // Send confirmation message in chat
    if (quote.conversation_id) {
      await supabaseAdmin.from("messages").insert({
        conversation_id: quote.conversation_id,
        sender_id: userId,
        content: `✅ Serviço concluído com sucesso!\n\n💰 Pagamento de R$ ${pendingTx.net_amount.toFixed(2).replace(".", ",")} liberado para o profissional.\n\nObrigado por usar nossa plataforma!`,
        message_type: "text",
      });
    }

    logStep("Payment released successfully", { 
      transactionId: pendingTx.id, 
      netAmount: pendingTx.net_amount,
      professionalId: appointment.professional_id 
    });

    return new Response(JSON.stringify({ 
      success: true,
      releasedAmount: pendingTx.net_amount,
      message: "Pagamento liberado com sucesso!"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error releasing payment", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
