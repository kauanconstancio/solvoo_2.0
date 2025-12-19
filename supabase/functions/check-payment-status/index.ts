import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();
    
    if (!quoteId) {
      throw new Error("Quote ID is required");
    }

    logStep("Checking payment status for quote", { quoteId });

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

    // Use service role for database operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get quote details
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      throw new Error("Quote not found");
    }

    // Verify the user is the client for this quote
    if (quote.client_id !== userData.user.id) {
      throw new Error("User is not the client for this quote");
    }

    // Check if there's a PIX ID to check
    if (!quote.pix_id) {
      return new Response(JSON.stringify({ 
        status: "NO_PIX",
        message: "No PIX payment found for this quote"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const abacatePayKey = Deno.env.get("ABACATEPAY_API_KEY");
    if (!abacatePayKey) {
      throw new Error("AbacatePay API key not configured");
    }

    // Check PIX status with AbacatePay
    const checkUrl = `https://api.abacatepay.com/v1/pixQrCode/check?id=${quote.pix_id}`;
    
    logStep("Checking PIX status", { pixId: quote.pix_id });

    const response = await fetch(checkUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${abacatePayKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      logStep("AbacatePay error", { status: response.status, error: errorData });
      throw new Error(`AbacatePay error: ${errorData}`);
    }

    const pixStatus = await response.json();
    
    logStep("PIX status received", { 
      status: pixStatus.data?.status,
      pixId: quote.pix_id
    });

    const status = pixStatus.data?.status;

    // If payment is confirmed (PAID), update quote and create wallet transaction
    if (status === "PAID" && !quote.client_confirmed) {
      logStep("Payment confirmed, updating quote and wallet");

      // Update quote
      const { error: updateError } = await supabaseAdmin
        .from("quotes")
        .update({
          client_confirmed: true,
          client_confirmed_at: new Date().toISOString(),
        })
        .eq("id", quoteId);

      if (updateError) {
        logStep("Error updating quote", { error: updateError.message });
        throw new Error("Failed to update quote status");
      }

      // Get client name for transaction
      const { data: clientProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("user_id", quote.client_id)
        .single();

      // Create wallet transaction for professional
      const fee = quote.price * PLATFORM_FEE_RATE;
      const netAmount = quote.price - fee;

      const { error: transactionError } = await supabaseAdmin
        .from("wallet_transactions")
        .insert({
          user_id: quote.professional_id,
          quote_id: quoteId,
          type: "credit",
          amount: quote.price,
          fee: fee,
          net_amount: netAmount,
          description: `Pagamento: ${quote.title}`,
          customer_name: clientProfile?.full_name || "Cliente",
          status: "completed",
        });

      if (transactionError) {
        logStep("Error creating transaction", { error: transactionError.message });
        // Don't throw here, payment was already confirmed
      } else {
        logStep("Wallet transaction created", { 
          professionalId: quote.professional_id,
          netAmount 
        });
      }
    }

    return new Response(JSON.stringify({ 
      status: status,
      expiresAt: pixStatus.data?.expiresAt,
      paid: status === "PAID"
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
