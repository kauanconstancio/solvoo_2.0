import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CANCEL-BOOKING-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId } = await req.json();

    if (!appointmentId) {
      throw new Error("Missing appointmentId");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Validate user
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId, appointmentId });

    // Admin client for DB ops
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Load appointment with quote info
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select("id, client_id, status, quote_id")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.client_id !== userId) {
      throw new Error("Not allowed");
    }

    if (appointment.status !== "awaiting_payment") {
      // Idempotent-ish: treat other statuses as already handled
      logStep("Appointment not awaiting payment; nothing to cancel", { status: appointment.status });
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get quote to check for PIX data
    let pixId: string | null = null;
    if (appointment.quote_id) {
      const { data: quote } = await supabaseAdmin
        .from("quotes")
        .select("pix_id")
        .eq("id", appointment.quote_id)
        .single();
      
      pixId = quote?.pix_id || null;
    }

    // Try to cancel PIX on AbacatePay (if exists)
    // NOTE: AbacatePay doesn't have a public "cancel" endpoint for PIX QR codes,
    // but we can try the billing cancel endpoint if the PIX was created via billing.
    // For pixQrCode, it will naturally expire. We just clear our local reference.
    if (pixId) {
      const abacatePayKey = Deno.env.get("ABACATEPAY_API_KEY");
      if (abacatePayKey) {
        try {
          // Attempt to cancel via billing API (may not work for pixQrCode)
          const cancelResponse = await fetch(`https://api.abacatepay.com/v1/billing/${pixId}/cancel`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${abacatePayKey}`,
              "Content-Type": "application/json"
            }
          });
          
          if (cancelResponse.ok) {
            logStep("PIX cancelled on AbacatePay", { pixId });
          } else {
            // Not critical - PIX will expire naturally
            const errorText = await cancelResponse.text();
            logStep("Could not cancel PIX on AbacatePay (will expire naturally)", { 
              pixId, 
              status: cancelResponse.status,
              error: errorText 
            });
          }
        } catch (err) {
          logStep("Failed to call AbacatePay cancel (non-blocking)", { pixId, error: String(err) });
        }
      }
    }

    // Cancel appointment
    const { error: cancelError } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", appointmentId);

    if (cancelError) {
      throw cancelError;
    }

    // Cancel quote and clear PIX data to prevent reuse
    if (appointment.quote_id) {
      await supabaseAdmin
        .from("quotes")
        .update({ 
          status: "cancelled", 
          updated_at: new Date().toISOString(),
          pix_id: null,
          pix_br_code: null,
          pix_br_code_base64: null,
          pix_expires_at: null
        })
        .eq("id", appointment.quote_id);
    }

    logStep("Cancelled", { appointmentId, quoteId: appointment.quote_id, pixCleared: !!pixId });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
