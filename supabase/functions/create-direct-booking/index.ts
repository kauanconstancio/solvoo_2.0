import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-DIRECT-BOOKING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      serviceId, 
      scheduledDate, 
      scheduledTime, 
      durationMinutes,
      serviceTitle,
      price
    } = await req.json();
    
    if (!serviceId || !scheduledDate || !scheduledTime) {
      throw new Error("Missing required fields");
    }

    logStep("Starting direct booking", { serviceId, scheduledDate, scheduledTime });

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

    // Use service role for all database operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get service details
    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("id, title, user_id, price")
      .eq("id", serviceId)
      .single();

    if (serviceError || !service) {
      throw new Error("Service not found");
    }

    const professionalId = service.user_id;
    logStep("Service found", { professionalId, title: service.title });

    // Check user CPF
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("cpf, full_name")
      .eq("user_id", userId)
      .single();

    if (!userProfile?.cpf) {
      throw new Error("CPF não cadastrado");
    }

    // Check if slot is already occupied
    const { data: existingAppointments, error: appointmentCheckError } = await supabaseAdmin
      .from("appointments")
      .select("id, scheduled_time, duration_minutes")
      .eq("professional_id", professionalId)
      .eq("scheduled_date", scheduledDate)
      .neq("status", "cancelled");

    if (appointmentCheckError) {
      logStep("Error checking existing appointments", { error: appointmentCheckError.message });
      throw appointmentCheckError;
    }

    // Calculate requested slot end time
    const [reqHours, reqMinutes] = scheduledTime.split(':').map(Number);
    const reqStartMinutes = reqHours * 60 + reqMinutes;
    const reqEndMinutes = reqStartMinutes + (durationMinutes || 60);

    // Check for conflicts
    for (const existing of existingAppointments || []) {
      const [exHours, exMinutes] = existing.scheduled_time.split(':').map(Number);
      const exStartMinutes = exHours * 60 + exMinutes;
      const exEndMinutes = exStartMinutes + existing.duration_minutes;

      // Check for overlap
      const hasConflict = (reqStartMinutes >= exStartMinutes && reqStartMinutes < exEndMinutes) ||
                          (reqEndMinutes > exStartMinutes && reqEndMinutes <= exEndMinutes) ||
                          (reqStartMinutes <= exStartMinutes && reqEndMinutes >= exEndMinutes);

      if (hasConflict) {
        logStep("Time slot conflict detected", { existingAppointment: existing.id });
        throw new Error("Este horário já está ocupado. Por favor, escolha outro horário.");
      }
    }

    logStep("No scheduling conflicts found");

    // Create or get conversation
    const { data: existingConv } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("client_id", userId)
      .eq("professional_id", professionalId)
      .eq("service_id", serviceId)
      .maybeSingle();

    let conversationId = existingConv?.id;

    if (!conversationId) {
      const { data: newConv, error: convError } = await supabaseAdmin
        .from("conversations")
        .insert({
          client_id: userId,
          professional_id: professionalId,
          service_id: serviceId,
        })
        .select("id")
        .single();

      if (convError) {
        logStep("Error creating conversation", { error: convError.message });
        throw convError;
      }
      conversationId = newConv.id;
    }

    logStep("Conversation ready", { conversationId });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create quote with status 'accepted' (auto-accepted for fixed price)
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .insert({
        conversation_id: conversationId,
        service_id: serviceId,
        professional_id: professionalId,
        client_id: userId,
        title: serviceTitle || service.title,
        description: `Agendamento direto para ${scheduledDate} às ${scheduledTime}`,
        price: price,
        validity_days: 7,
        expires_at: expiresAt.toISOString(),
        status: "accepted",
        responded_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (quoteError) {
      logStep("Error creating quote", { error: quoteError.message });
      throw quoteError;
    }

    logStep("Quote created", { quoteId: quote.id });

    // Create appointment linked to quote
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .insert({
        client_id: userId,
        professional_id: professionalId,
        service_id: serviceId,
        conversation_id: conversationId,
        quote_id: quote.id,
        title: serviceTitle || service.title,
        description: "Serviço agendado diretamente pelo cliente",
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: durationMinutes || 60,
        status: "pending",
        client_confirmed: false,
        professional_confirmed: true,
      })
      .select("id")
      .single();

    if (appointmentError) {
      logStep("Error creating appointment", { error: appointmentError.message });
      throw appointmentError;
    }

    logStep("Appointment created", { appointmentId: appointment.id });

    // Send automatic message in chat
    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: `📅 Novo agendamento solicitado!\n\n🗓 Data: ${scheduledDate}\n⏰ Horário: ${scheduledTime}\n💰 Valor: R$ ${price.toFixed(2).replace(".", ",")}\n\n⏳ Aguardando pagamento...`,
      message_type: "text",
    });

    logStep("Message sent");

    return new Response(JSON.stringify({ 
      success: true,
      appointmentId: appointment.id,
      quoteId: quote.id,
      conversationId: conversationId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error creating direct booking", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
