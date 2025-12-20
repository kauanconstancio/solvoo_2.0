import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Clock, QrCode, Loader2, X, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
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

// Success Animation Component
const PaymentSuccessAnimation = ({ 
  price, 
  onClose 
}: { 
  price: number; 
  onClose: () => void;
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-card rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
        {/* Confetti-like particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${10 + (i * 7)}%`,
                top: `${5 + (i % 3) * 10}%`,
                backgroundColor: ['#22c55e', '#10b981', '#34d399', '#6ee7b7'][i % 4],
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${1 + (i % 3) * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Success Icon with Animation */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg animate-pulse">
              <CheckCircle2 className="h-14 w-14 text-white" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -left-1">
              <Sparkles className="h-5 w-5 text-yellow-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>

          <h2 className="mt-6 text-2xl font-bold text-foreground">
            Pagamento Confirmado!
          </h2>
          
          <p className="mt-2 text-muted-foreground">
            Seu pagamento foi processado com sucesso
          </p>

          <div className="mt-4 py-3 px-6 bg-green-500/10 rounded-xl">
            <p className="text-3xl font-bold text-green-600">
              {formatPrice(price)}
            </p>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            O profissional foi notificado e entrará em contato em breve.
          </p>

          <Button
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
            onClick={onClose}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
};

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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
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
        setPaidAmount(pixData?.quotePrice || 0);
        
        // Close the PIX dialog and show success popup
        onOpenChange(false);
        setShowSuccessPopup(true);
        
        onPaymentConfirmed?.();
      } else if (data?.status === "EXPIRED") {
        setPaymentStatus("expired");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [quoteId, pixData?.pixId, pixData?.quotePrice, paymentStatus, onOpenChange, onPaymentConfirmed]);

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
      setShowSuccessPopup(false);
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

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    setPaidAmount(0);
  };

  return (
    <>
      {/* Success Popup - shown outside the dialog */}
      {showSuccessPopup && (
        <PaymentSuccessAnimation 
          price={paidAmount} 
          onClose={handleCloseSuccessPopup} 
        />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Pagamento via PIX
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código para pagar
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando código PIX...</p>
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
                    loading="lazy"
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
    </>
  );
};
