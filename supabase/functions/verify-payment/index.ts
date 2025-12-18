import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, quoteId } = await req.json();
    
    if (!sessionId || !quoteId) {
      throw new Error("Session ID and Quote ID are required");
    }

    console.log("Verifying payment for session:", sessionId, "quote:", quoteId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Verify quote_id matches
    if (session.metadata?.quote_id !== quoteId) {
      throw new Error("Quote ID mismatch");
    }

    console.log("Payment verified, session:", session.id);

    // Use service role to update the database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if already processed
    const { data: existingQuote } = await supabaseAdmin
      .from("quotes")
      .select("client_confirmed, client_id, professional_id, title, price")
      .eq("id", quoteId)
      .single();

    if (!existingQuote) {
      throw new Error("Quote not found");
    }

    if (existingQuote.client_confirmed) {
      console.log("Quote already confirmed, skipping...");
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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
      console.error("Error updating quote:", quoteError);
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
      console.error("Error creating transaction:", transactionError);
      throw transactionError;
    }

    console.log("Payment processed successfully for quote:", quoteId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});