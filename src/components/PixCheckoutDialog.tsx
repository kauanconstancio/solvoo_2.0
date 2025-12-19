import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Clock, QrCode, Loader2, X, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface PixCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string | null;
  pixData: {
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt: string;
    quoteTitle: string;
    quotePrice: number;
  } | null;
  isLoading?: boolean;
  onPaymentConfirmed?: () => void;
}

export const PixCheckoutDialog = ({
  open,
  onOpenChange,
  quoteId,
  pixData,
  isLoading = false,
  onPaymentConfirmed,
}: PixCheckoutDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"checking" | "pending" | "paid" | "expired">("pending");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!quoteId || !pixData?.pixId || paymentStatus === "paid") return;

    try {
      setIsCheckingStatus(true);
      const { data, error } = await supabase.functions.invoke("check-payment-status", {
        body: { quoteId },
      });

      if (error) throw error;

      if (data?.status === "PAID") {
        setPaymentStatus("paid");
        toast({
          title: "Pagamento confirmado!",
          description: "Seu pagamento foi processado com sucesso.",
        });
        onPaymentConfirmed?.();
      } else if (data?.status === "EXPIRED") {
        setPaymentStatus("expired");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [quoteId, pixData?.pixId, paymentStatus, toast, onPaymentConfirmed]);

  // Poll for payment status every 5 seconds
  useEffect(() => {
    if (!open || !quoteId || !pixData?.pixId || paymentStatus === "paid" || paymentStatus === "expired") {
      return;
    }

    // Initial check
    checkPaymentStatus();

    // Set up polling
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [open, quoteId, pixData?.pixId, paymentStatus, checkPaymentStatus]);

  // Reset status when dialog opens with new data
  useEffect(() => {
    if (open && pixData) {
      setPaymentStatus("pending");
    }
  }, [open, pixData?.pixId]);

  // Timer for expiration
  useEffect(() => {
    if (!pixData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(pixData.expiresAt).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("Expirado");
        setPaymentStatus("expired");
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [pixData?.expiresAt]);

  const handleCopy = async () => {
    if (!pixData?.brCode) return;

    try {
      await navigator.clipboard.writeText(pixData.brCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no app do seu banco para pagar.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente o código.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentStatus === "paid" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <QrCode className="h-5 w-5 text-primary" />
            )}
            {paymentStatus === "paid" ? "Pagamento Confirmado" : "Pagamento via PIX"}
          </DialogTitle>
          <DialogDescription>
            {paymentStatus === "paid" 
              ? "Seu pagamento foi processado com sucesso!" 
              : "Escaneie o QR Code ou copie o código para pagar"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando código PIX...</p>
          </div>
        ) : paymentStatus === "paid" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">Pagamento confirmado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                O valor de {formatPrice(pixData?.quotePrice || 0)} foi pago com sucesso.
              </p>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        ) : pixData ? (
          <div className="space-y-4 py-4">
            {/* Quote Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pagamento para:</p>
              <p className="font-medium">{pixData.quoteTitle}</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatPrice(pixData.quotePrice)}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              {pixData.brCodeBase64 ? (
                <img
                  src={pixData.brCodeBase64}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-muted rounded">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 p-2 bg-yellow-500/10 rounded-lg">
              {isCheckingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
              ) : (
                <RefreshCw className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm text-yellow-600 font-medium">
                Aguardando pagamento...
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expira em: <strong className={cn(
                timeLeft === "Expirado" ? "text-destructive" : "text-foreground"
              )}>{timeLeft}</strong></span>
            </div>

            {/* Copy Button */}
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleCopy}
              disabled={copied || paymentStatus === "expired"}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Código copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar código PIX
                </>
              )}
            </Button>

            {/* PIX Code Preview */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Código PIX (Copia e Cola):</p>
              <p className="text-xs font-mono break-all select-all">
                {pixData.brCode?.substring(0, 80)}...
              </p>
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>1. Abra o app do seu banco</p>
              <p>2. Escolha pagar via PIX com QR Code ou código</p>
              <p>3. Confirme o pagamento</p>
            </div>

            {/* Close Button */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <X className="h-12 w-12 text-destructive" />
            <p className="text-sm text-muted-foreground">Erro ao gerar código PIX</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
