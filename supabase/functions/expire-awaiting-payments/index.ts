import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[expire-awaiting-payments] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const abacatePayKey = Deno.env.get('ABACATEPAY_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find appointments awaiting_payment created more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: expiredAppointments, error: selectError } = await supabase
      .from('appointments')
      .select('id, quote_id, client_id, professional_id, title, scheduled_date, scheduled_time')
      .eq('status', 'awaiting_payment')
      .lt('created_at', oneHourAgo);

    if (selectError) {
      logStep('Error selecting expired appointments', { error: selectError });
      throw selectError;
    }

    if (!expiredAppointments || expiredAppointments.length === 0) {
      logStep('No expired awaiting_payment appointments found');
      return new Response(
        JSON.stringify({ message: 'No expired appointments found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Found expired appointments', { count: expiredAppointments.length });

    const results: { appointmentId: string; success: boolean; pixCancelled?: boolean }[] = [];

    for (const appointment of expiredAppointments) {
      try {
        // Get quote with PIX data
        let pixId: string | null = null;
        if (appointment.quote_id) {
          const { data: quote } = await supabase
            .from('quotes')
            .select('pix_id')
            .eq('id', appointment.quote_id)
            .single();
          
          pixId = quote?.pix_id || null;
        }

        // Try to cancel PIX on AbacatePay
        let pixCancelled = false;
        if (pixId && abacatePayKey) {
          try {
            const cancelResponse = await fetch(`https://api.abacatepay.com/v1/billing/${pixId}/cancel`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${abacatePayKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (cancelResponse.ok) {
              pixCancelled = true;
              logStep('PIX cancelled on AbacatePay', { pixId, appointmentId: appointment.id });
            }
          } catch (err) {
            logStep('Failed to cancel PIX (non-blocking)', { pixId, error: String(err) });
          }
        }

        // Cancel appointment
        const { error: cancelError } = await supabase
          .from('appointments')
          .update({ 
            status: 'cancelled', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', appointment.id);

        if (cancelError) {
          throw cancelError;
        }

        // Cancel quote and clear PIX data
        if (appointment.quote_id) {
          await supabase
            .from('quotes')
            .update({ 
              status: 'cancelled', 
              updated_at: new Date().toISOString(),
              pix_id: null,
              pix_br_code: null,
              pix_br_code_base64: null,
              pix_expires_at: null
            })
            .eq('id', appointment.quote_id);
        }

        // Notify client about expiration
        await supabase
          .from('notifications')
          .insert({
            user_id: appointment.client_id,
            type: 'appointment',
            title: '⏰ Agendamento expirado',
            message: `Seu agendamento "${appointment.title}" foi cancelado pois o pagamento não foi realizado a tempo.`,
            data: {
              appointment_id: appointment.id,
              scheduled_date: appointment.scheduled_date,
              scheduled_time: appointment.scheduled_time
            }
          });

        // Notify professional
        await supabase
          .from('notifications')
          .insert({
            user_id: appointment.professional_id,
            type: 'appointment',
            title: '⏰ Agendamento expirado',
            message: `O agendamento "${appointment.title}" foi cancelado automaticamente - pagamento não realizado.`,
            data: {
              appointment_id: appointment.id,
              scheduled_date: appointment.scheduled_date,
              scheduled_time: appointment.scheduled_time
            }
          });

        results.push({ appointmentId: appointment.id, success: true, pixCancelled });
        logStep('Expired appointment', { appointmentId: appointment.id, pixCancelled });
      } catch (err) {
        logStep('Failed to expire appointment', { appointmentId: appointment.id, error: String(err) });
        results.push({ appointmentId: appointment.id, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;
    logStep('Completed', { total: expiredAppointments.length, success: successCount });

    return new Response(
      JSON.stringify({ 
        message: 'Expired appointments processed', 
        total: expiredAppointments.length,
        success: successCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logStep('Error in expire-awaiting-payments', { error: String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
