import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const quoteId = searchParams.get("quote_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!quoteId) {
        setStatus("error");
        setErrorMessage("Informações de pagamento não encontradas.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { quoteId },
        });

        if (error) throw error;

        if (data.success) {
          setStatus("success");
          toast({
            title: "Pagamento confirmado!",
            description: "O pagamento foi processado com sucesso.",
          });
        } else {
          throw new Error("Falha na verificação do pagamento");
        }
      } catch (error: any) {
        console.error("Error verifying payment:", error);
        setStatus("error");
        setErrorMessage(error.message || "Erro ao verificar pagamento.");
      }
    };

    verifyPayment();
  }, [quoteId, toast]);

  const handleGoToChat = async () => {
    if (!quoteId) {
      navigate("/chat");
      return;
    }

    try {
      const { data: quote } = await supabase
        .from("quotes")
        .select("conversation_id")
        .eq("id", quoteId)
        .single();

      if (quote?.conversation_id) {
        navigate(`/chat/${quote.conversation_id}`);
      } else {
        navigate("/chat");
      }
    } catch {
      navigate("/chat");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">Verificando pagamento...</h1>
            <p className="text-muted-foreground">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <div className="p-4 bg-green-500/10 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-600">
              Pagamento Confirmado!
            </h1>
            <p className="text-muted-foreground">
              O pagamento foi processado com sucesso e o profissional foi notificado.
              Obrigado por usar nossa plataforma!
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleGoToChat} className="w-full">
                Voltar ao Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Ir para Início
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <div className="p-4 bg-red-500/10 rounded-full">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-600">
              Erro no Pagamento
            </h1>
            <p className="text-muted-foreground">
              {errorMessage || "Ocorreu um erro ao processar seu pagamento."}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleGoToChat} className="w-full">
                Voltar ao Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Ir para Início
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;