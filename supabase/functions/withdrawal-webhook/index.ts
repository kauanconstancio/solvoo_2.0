import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log("Withdrawal webhook received:", JSON.stringify(payload));

    // AbacatePay sends the withdrawal data in the payload
    const withdrawalData = payload.data || payload;
    const externalId = withdrawalData.externalId || withdrawalData.external_id;
    const status = withdrawalData.status;

    if (!externalId) {
      console.log("No externalId in webhook payload");
      return new Response(
        JSON.stringify({ success: true, message: "No externalId provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract withdrawal ID from externalId (format: withdrawal-{uuid})
    const withdrawalId = externalId.replace("withdrawal-", "");

    // Find the wallet transaction
    const { data: transaction, error: txError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (txError || !transaction) {
      console.log("Transaction not found:", withdrawalId);
      return new Response(
        JSON.stringify({ success: true, message: "Transaction not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let newStatus = transaction.status;
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType = "";

    switch (status) {
      case "COMPLETE":
      case "COMPLETED":
        newStatus = "completed";
        notificationType = "withdrawal_completed";
        notificationTitle = "Saque concluído!";
        notificationMessage = `Seu saque de R$ ${transaction.amount.toFixed(2)} foi enviado com sucesso para sua conta.`;
        break;

      case "CANCELLED":
      case "CANCELED":
      case "FAILED":
        newStatus = "cancelled";
        notificationType = "withdrawal_failed";
        notificationTitle = "Saque falhou";
        notificationMessage = `Não foi possível processar seu saque de R$ ${transaction.amount.toFixed(2)}. O valor foi devolvido ao seu saldo.`;
        break;

      case "PENDING":
        // Still processing, just update status
        newStatus = "processing";
        break;

      default:
        console.log("Unknown status:", status);
    }

    // Update the transaction
    const updateData: Record<string, unknown> = {
      abacatepay_status: status,
    };

    if (newStatus !== transaction.status) {
      updateData.status = newStatus;
    }

    // Add receipt URL if provided
    if (withdrawalData.receiptUrl || withdrawalData.receipt_url) {
      updateData.abacatepay_receipt_url = withdrawalData.receiptUrl || withdrawalData.receipt_url;
    }

    const { error: updateError } = await supabase
      .from("wallet_transactions")
      .update(updateData)
      .eq("id", withdrawalId);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      throw updateError;
    }

    // Send notification if status changed to final state
    if (notificationType) {
      await supabase.from("notifications").insert({
        user_id: transaction.user_id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        data: {
          withdrawal_id: withdrawalId,
          amount: transaction.amount,
          status: newStatus,
        },
      });
    }

    console.log(`Withdrawal ${withdrawalId} updated to status: ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});