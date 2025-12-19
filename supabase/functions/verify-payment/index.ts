import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
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

    logStep("Verifying payment for quote", { quoteId });

    const abacatePayKey = Deno.env.get("ABACATEPAY_API_KEY");
    if (!abacatePayKey) {
      throw new Error("AbacatePay API key not configured");
    }

    // Use service role to update the database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if already processed
    const { data: existingQuote } = await supabaseAdmin
      .from("quotes")
      .select("client_confirmed, client_id, professional_id, title, price, conversation_id")
      .eq("id", quoteId)
      .single();

    if (!existingQuote) {
      throw new Error("Quote not found");
    }

    if (existingQuote.client_confirmed) {
      logStep("Quote already confirmed, skipping...");
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check payment status with AbacatePay
    // We need to find the billing by the quote metadata
    logStep("Fetching billings from AbacatePay");

    const billingListResponse = await fetch("https://api.abacatepay.com/v1/billing/list", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${abacatePayKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!billingListResponse.ok) {
      const errorText = await billingListResponse.text();
      logStep("Error fetching billings", { error: errorText });
      throw new Error(`Failed to fetch billings: ${errorText}`);
    }

    const billingList = await billingListResponse.json();
    logStep("Billings fetched", { count: billingList.data?.length || 0 });

    // Find the billing for this quote
    const billing = billingList.data?.find((b: { metadata?: { quote_id?: string }; products?: Array<{ externalId?: string }> }) => 
      b.metadata?.quote_id === quoteId || 
      b.products?.some((p: { externalId?: string }) => p.externalId === quoteId)
    );

    if (!billing) {
      logStep("Billing not found for quote", { quoteId });
      throw new Error("Billing not found for this quote");
    }

    logStep("Billing found", { billingId: billing.id, status: billing.status });

    // Check if payment was completed
    if (billing.status !== "PAID") {
      logStep("Payment not completed yet", { status: billing.status });
      throw new Error(`Payment not completed. Status: ${billing.status}`);
    }

    logStep("Payment verified, processing...");

    // Get client name
    const { data: clientProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("user_id", existingQuote.client_id)
      .single();

    const clientName = clientProfile?.full_name || "Cliente";

    // Update quote as confirmed
    const { error: quoteError } = await supabaseAdmin
      .from("quotes")
      .update({
        client_confirmed: true,
        client_confirmed_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (quoteError) {
      logStep("Error updating quote", { error: quoteError });
      throw quoteError;
    }

    // Create wallet transaction for the professional
    const fee = existingQuote.price * PLATFORM_FEE_RATE;
    const netAmount = existingQuote.price - fee;

    const { error: transactionError } = await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        user_id: existingQuote.professional_id,
        quote_id: quoteId,
        type: "credit",
        amount: existingQuote.price,
        fee,
        net_amount: netAmount,
        description: `Pagamento - ${existingQuote.title}`,
        customer_name: clientName,
        status: "completed",
      });

    if (transactionError) {
      logStep("Error creating transaction", { error: transactionError });
      throw transactionError;
    }

    logStep("Payment processed successfully", { quoteId, netAmount });

    return new Response(JSON.stringify({ 
      success: true, 
      conversationId: existingQuote.conversation_id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error verifying payment", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
