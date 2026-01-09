import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId } = await req.json();
    
    if (!planId) {
      throw new Error("Plan ID is required");
    }

    logStep("Starting subscription checkout for plan", { planId });

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

    // Use service role to get plan details
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found or inactive");
    }

    logStep("Plan found", { planId, planName: plan.name, price: plan.price });

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingSubscription) {
      throw new Error("Você já possui uma assinatura ativa. Cancele a atual antes de assinar um novo plano.");
    }

    // If plan is free, create subscription directly
    if (plan.price === 0) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { data: newSubscription, error: subError } = await supabaseAdmin
        .from("user_subscriptions")
        .insert({
          user_id: userData.user.id,
          plan_id: planId,
          status: "active",
          amount_paid: 0,
          payment_method: "free",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (subError) throw subError;

      logStep("Free subscription created", { subscriptionId: newSubscription.id });

      return new Response(JSON.stringify({ 
        success: true,
        subscription: newSubscription,
        isFree: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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

    // Create a pending subscription record to track
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data: pendingSubscription, error: pendingError } = await supabaseAdmin
      .from("user_subscriptions")
      .insert({
        user_id: userData.user.id,
        plan_id: planId,
        status: "pending",
        amount_paid: plan.price,
        payment_method: "pix",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (pendingError) throw pendingError;

    logStep("Pending subscription created", { subscriptionId: pendingSubscription.id });

    // Create PIX QR Code with AbacatePay
    const billingPeriod = plan.billing_period === "monthly" ? "mensal" : "anual";
    const pixPayload = {
      amount: Math.round(plan.price * 100), // Convert to cents
      expiresIn: 3600, // 1 hour expiration
      description: `Assinatura ${plan.name} - Plano ${billingPeriod}`,
      customer: {
        name: userProfile?.full_name || "Cliente",
        email: userData.user.email,
        cellphone: userProfile?.phone || undefined,
        taxId: cleanCpf
      },
      metadata: {
        subscription_id: pendingSubscription.id,
        plan_id: planId,
        user_id: userData.user.id,
        plan_name: plan.name,
        type: "subscription"
      }
    };

    logStep("Creating PIX QR Code", { 
      amount: pixPayload.amount,
      customerEmail: userData.user.email,
      planName: plan.name
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
      
      // Delete the pending subscription on error
      await supabaseAdmin
        .from("user_subscriptions")
        .delete()
        .eq("id", pendingSubscription.id);
      
      throw new Error(`AbacatePay error: ${errorData}`);
    }

    const pixData = await pixResponse.json();
    
    logStep("PIX QR Code created successfully", { 
      pixId: pixData.data?.id,
      status: pixData.data?.status
    });

    return new Response(JSON.stringify({ 
      pixId: pixData.data?.id,
      brCode: pixData.data?.brCode,
      brCodeBase64: pixData.data?.brCodeBase64,
      amount: pixData.data?.amount,
      expiresAt: pixData.data?.expiresAt,
      subscriptionId: pendingSubscription.id,
      planName: plan.name,
      planPrice: plan.price
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error creating subscription checkout", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
