import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscriptionId, pixId } = await req.json();
    
    if (!subscriptionId) {
      throw new Error("Subscription ID is required");
    }

    logStep("Checking payment status for subscription", { subscriptionId, pixId });

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

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("user_subscriptions")
      .select(`
        *,
        plan:subscription_plans(name, price)
      `)
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found");
    }

    // Verify user owns this subscription
    if (subscription.user_id !== userData.user.id) {
      throw new Error("Unauthorized");
    }

    // If already active, return success
    if (subscription.status === "active") {
      logStep("Subscription already active", { subscriptionId });
      return new Response(JSON.stringify({ 
        status: "PAID",
        paid: true,
        subscription
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!pixId) {
      return new Response(JSON.stringify({ 
        status: "NO_PIX",
        paid: false 
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

    const pixResponse = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${pixId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${abacatePayKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!pixResponse.ok) {
      const errorData = await pixResponse.text();
      logStep("AbacatePay status check error", { status: pixResponse.status, error: errorData });
      throw new Error(`AbacatePay error: ${errorData}`);
    }

    const pixData = await pixResponse.json();
    const pixStatus = pixData.data?.status || "PENDING";
    
    logStep("PIX status retrieved", { status: pixStatus });

    // If paid, activate subscription
    if (pixStatus === "PAID") {
      const { data: updatedSubscription, error: updateError } = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          status: "active",
          updated_at: new Date().toISOString()
        })
        .eq("id", subscriptionId)
        .select()
        .single();

      if (updateError) {
        logStep("Error updating subscription", { error: updateError.message });
        throw new Error("Failed to activate subscription");
      }

      logStep("Subscription activated", { subscriptionId });

      return new Response(JSON.stringify({ 
        status: "PAID",
        paid: true,
        subscription: updatedSubscription
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      status: pixStatus,
      paid: false,
      expiresAt: pixData.data?.expiresAt
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error checking payment status", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
