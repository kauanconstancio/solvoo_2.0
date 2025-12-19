import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting appointment reminders check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const oneHourFromNow = new Date(now);
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    // Find appointments that need 24h reminders (tomorrow, same time or earlier)
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    
    const { data: upcomingAppointments, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "confirmed")
      .eq("reminder_24h_sent", false)
      .eq("scheduled_date", tomorrowDate);

    if (fetchError) {
      console.error("Error fetching appointments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${upcomingAppointments?.length || 0} appointments needing 24h reminders`);

    // Process each appointment
    const remindersToSend = [];

    for (const apt of upcomingAppointments || []) {
      console.log(`Processing 24h reminder for appointment ${apt.id}`);

      // Send reminder message in the conversation
      const reminderMessage = `📅 **Lembrete de Agendamento**\n\nSeu agendamento "${apt.title}" está confirmado para amanhã às ${apt.scheduled_time}.\n\n${apt.location ? `📍 Local: ${apt.location}\n` : ""}${apt.description ? `📝 Obs: ${apt.description}\n` : ""}\nNão se esqueça de estar disponível no horário combinado!`;

      if (apt.conversation_id) {
        // Send message to client
        await supabase.from("messages").insert({
          conversation_id: apt.conversation_id,
          sender_id: apt.professional_id,
          content: reminderMessage,
          message_type: "text",
        });

        // Update last_message_at
        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", apt.conversation_id);
      }

      // Mark reminder as sent
      await supabase
        .from("appointments")
        .update({ reminder_24h_sent: true })
        .eq("id", apt.id);

      remindersToSend.push({
        appointmentId: apt.id,
        type: "24h",
        title: apt.title,
      });
    }

    // Find appointments that need 1h reminders (happening in the next hour)
    const todayDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const oneHourTime = oneHourFromNow.toTimeString().slice(0, 5);

    const { data: imminentAppointments, error: imminentError } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "confirmed")
      .eq("reminder_sent", false)
      .eq("scheduled_date", todayDate)
      .gte("scheduled_time", currentTime)
      .lte("scheduled_time", oneHourTime);

    if (imminentError) {
      console.error("Error fetching imminent appointments:", imminentError);
      throw imminentError;
    }

    console.log(`Found ${imminentAppointments?.length || 0} appointments needing 1h reminders`);

    for (const apt of imminentAppointments || []) {
      console.log(`Processing 1h reminder for appointment ${apt.id}`);

      const reminderMessage = `⏰ **Lembrete Urgente**\n\nSeu agendamento "${apt.title}" começa em menos de 1 hora (${apt.scheduled_time})!\n\n${apt.location ? `📍 Local: ${apt.location}\n` : ""}Prepare-se para o atendimento.`;

      if (apt.conversation_id) {
        await supabase.from("messages").insert({
          conversation_id: apt.conversation_id,
          sender_id: apt.professional_id,
          content: reminderMessage,
          message_type: "text",
        });

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", apt.conversation_id);
      }

      await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", apt.id);

      remindersToSend.push({
        appointmentId: apt.id,
        type: "1h",
        title: apt.title,
      });
    }

    console.log(`Processed ${remindersToSend.length} reminders total`);

    return new Response(
      JSON.stringify({
        success: true,
        remindersProcessed: remindersToSend.length,
        reminders: remindersToSend,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-appointment-reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
