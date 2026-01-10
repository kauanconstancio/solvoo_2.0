import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ABACATEPAY_API_URL = "https://api.abacatepay.com/v1";
const WITHDRAWAL_FEE = 0.80; // R$ 0,80 per withdrawal

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const abacatePayApiKey = Deno.env.get("ABACATEPAY_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const { withdrawalId } = await req.json();
    if (!withdrawalId) {
      throw new Error("Withdrawal ID is required");
    }

    // Fetch the withdrawal transaction
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("wallet_transactions")
      .select("*, bank_accounts(*)")
      .eq("id", withdrawalId)
      .eq("type", "withdrawal")
      .eq("status", "pending")
      .single();

    if (withdrawalError || !withdrawal) {
      throw new Error("Withdrawal not found or already processed");
    }

    // If no bank_account linked, try to get default
    let bankAccount = withdrawal.bank_accounts;
    if (!bankAccount && withdrawal.bank_account_id) {
      const { data: account } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("id", withdrawal.bank_account_id)
        .single();
      bankAccount = account;
    }

    if (!bankAccount && !withdrawal.bank_account_id) {
      const { data: defaultAccount } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", withdrawal.user_id)
        .eq("is_default", true)
        .single();
      bankAccount = defaultAccount;
    }

    if (!bankAccount || !bankAccount.pix_key) {
      throw new Error("No valid bank account or PIX key found");
    }

    // Map pix_key_type to AbacatePay format
    const pixTypeMap: Record<string, string> = {
      cpf: "CPF",
      cnpj: "CNPJ",
      email: "EMAIL",
      phone: "PHONE",
      random: "RANDOM",
      telefone: "PHONE",
      aleatorio: "RANDOM",
    };

    const pixType = pixTypeMap[bankAccount.pix_key_type?.toLowerCase() || "cpf"] || "CPF";

    // Get user profile for description
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", withdrawal.user_id)
      .single();

    const professionalName = profile?.full_name || "Profissional";

    // The amount to transfer (withdrawal fee is already deducted in the platform fee)
    const amountInCents = Math.round(withdrawal.amount * 100);

    // Create withdrawal via AbacatePay API
    const abacatePayResponse = await fetch(`${ABACATEPAY_API_URL}/withdraw/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${abacatePayApiKey}`,
      },
      body: JSON.stringify({
        externalId: `withdrawal-${withdrawalId}`,
        method: "PIX",
        amount: amountInCents,
        pix: {
          type: pixType,
          key: bankAccount.pix_key,
        },
        description: `Saque Solvoo - ${professionalName}`,
      }),
    });

    const abacatePayData = await abacatePayResponse.json();

    if (!abacatePayResponse.ok) {
      console.error("AbacatePay error:", abacatePayData);
      
      // Update withdrawal with error status
      await supabase
        .from("wallet_transactions")
        .update({
          abacatepay_status: "FAILED",
          rejection_reason: abacatePayData.message || "Falha ao processar saque via AbacatePay",
        })
        .eq("id", withdrawalId);

      throw new Error(abacatePayData.message || "Failed to create withdrawal");
    }

    console.log("AbacatePay withdrawal created:", abacatePayData);

    // Update the wallet transaction with AbacatePay data
    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update({
        status: "processing",
        abacatepay_withdrawal_id: abacatePayData.data?.id || abacatePayData.id,
        abacatepay_status: abacatePayData.data?.status || "PENDING",
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq("id", withdrawalId);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      throw updateError;
    }

    // Create notification for user
    await supabase.from("notifications").insert({
      user_id: withdrawal.user_id,
      type: "withdrawal_processing",
      title: "Saque em processamento",
      message: `Seu saque de R$ ${withdrawal.amount.toFixed(2)} está sendo processado via PIX.`,
      data: {
        withdrawal_id: withdrawalId,
        amount: withdrawal.amount,
      },
    });

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "process_withdrawal_abacatepay",
      target_type: "wallet_transaction",
      target_id: withdrawalId,
      details: {
        amount: withdrawal.amount,
        abacatepay_id: abacatePayData.data?.id || abacatePayData.id,
        pix_key: bankAccount.pix_key,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Withdrawal processing started",
        abacatepay_id: abacatePayData.data?.id || abacatePayData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing withdrawal:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});