import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    logStep("Starting checkout for quote", { quoteId });

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

    // Use service role to get quote details
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get quote details
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .select(`
        *,
        service:services(title)
      `)
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      throw new Error("Quote not found");
    }

    logStep("Quote found", { quoteId, price: quote.price, title: quote.title });

    // Verify the user is the client for this quote
    if (quote.client_id !== userData.user.id) {
      throw new Error("User is not the client for this quote");
    }

    // Verify quote is in accepted status
    if (quote.status !== "accepted") {
      throw new Error("Quote must be accepted to proceed with payment");
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

    const origin = req.headers.get("origin") || "https://solvoo.com.br";
    const abacatePayKey = Deno.env.get("ABACATEPAY_API_KEY");

    if (!abacatePayKey) {
      throw new Error("AbacatePay API key not configured");
    }

    logStep("AbacatePay initialized");

    // Create billing with AbacatePay
    const billingPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [{
        externalId: quoteId,
        name: quote.title,
        description: quote.service?.title || "Pagamento de serviço",
        quantity: 1,
        price: Math.round(quote.price * 100) // Convert to cents
      }],
      returnUrl: `${origin}/chat/${quote.conversation_id}`,
      completionUrl: `${origin}/pagamento-sucesso?quote_id=${quoteId}`,
      customer: {
        name: userProfile?.full_name || "Cliente",
        email: userData.user.email,
        cellphone: userProfile?.phone || undefined,
        taxId: cleanCpf
      },
      metadata: {
        quote_id: quoteId,
        client_id: userData.user.id,
        professional_id: quote.professional_id,
        conversation_id: quote.conversation_id
      }
    };

    logStep("Creating AbacatePay billing", { 
      amount: billingPayload.products[0].price,
      customerEmail: userData.user.email
    });

    const abacateResponse = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${abacatePayKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(billingPayload)
    });

    if (!abacateResponse.ok) {
      const errorData = await abacateResponse.text();
      logStep("AbacatePay error", { status: abacateResponse.status, error: errorData });
      throw new Error(`AbacatePay error: ${errorData}`);
    }

    const billingData = await abacateResponse.json();
    
    logStep("Billing created successfully", { 
      billingId: billingData.data?.id,
      url: billingData.data?.url
    });

    return new Response(JSON.stringify({ 
      url: billingData.data?.url,
      billingId: billingData.data?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error creating checkout", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
