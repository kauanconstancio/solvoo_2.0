import { useState } from "react";
import {
  FileText,
  Clock,
  Check,
  X,
  Ban,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Quote } from "@/hooks/useQuotes";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface QuoteCardProps {
  quote: Quote;
  currentUserId: string;
  onAccept: (quoteId: string, response?: string) => Promise<boolean>;
  onReject: (quoteId: string, response?: string) => Promise<boolean>;
  onCancel: (quoteId: string) => Promise<boolean>;
}

const statusConfig = {
  pending: {
    label: "Aguardando resposta",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  accepted: {
    label: "Aceito",
    icon: CheckCircle2,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  rejected: {
    label: "Recusado",
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  expired: {
    label: "Expirado",
    icon: AlertCircle,
    color: "bg-muted text-muted-foreground border-muted",
  },
  cancelled: {
    label: "Cancelado",
    icon: Ban,
    color: "bg-muted text-muted-foreground border-muted",
  },
};

export const QuoteCard = ({
  quote,
  currentUserId,
  onAccept,
  onReject,
  onCancel,
}: QuoteCardProps) => {
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState<"accept" | "reject" | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isProfessional = currentUserId === quote.professional_id;
  const isClient = currentUserId === quote.client_id;
  const isExpired = isPast(new Date(quote.expires_at)) && quote.status === "pending";
  
  const effectiveStatus = isExpired ? "expired" : quote.status;
  const statusInfo = statusConfig[effectiveStatus];
  const StatusIcon = statusInfo.icon;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleOpenResponse = (type: "accept" | "reject") => {
    setResponseType(type);
    setResponseMessage("");
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseType) return;
    
    setIsSubmitting(true);
    const success = responseType === "accept"
      ? await onAccept(quote.id, responseMessage)
      : await onReject(quote.id, responseMessage);
    
    setIsSubmitting(false);
    if (success) {
      setShowResponseDialog(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    const success = await onCancel(quote.id);
    setIsSubmitting(false);
    if (success) {
      setShowCancelDialog(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto my-4 animate-fade-in">
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-primary/5 px-4 py-3 border-b border-border/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">Orçamento</span>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs", statusInfo.color)}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-base">{quote.title}</h4>
              {quote.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {quote.description}
                </p>
              )}
            </div>

            {quote.service && (
              <div className="text-xs text-muted-foreground">
                Serviço: {quote.service.title}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div>
                <span className="text-xs text-muted-foreground">Valor</span>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(quote.price)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3" />
                  Válido até
                </span>
                <p className="text-sm font-medium">
                  {format(new Date(quote.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Client Response */}
            {quote.client_response && quote.status !== "pending" && (
              <div className="p-3 bg-muted/50 rounded-lg mt-2">
                <span className="text-xs text-muted-foreground">
                  Resposta do cliente:
                </span>
                <p className="text-sm mt-1">{quote.client_response}</p>
              </div>
            )}

            {/* Actions */}
            {effectiveStatus === "pending" && (
              <div className="flex gap-2 pt-2">
                {isClient && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-600"
                      onClick={() => handleOpenResponse("reject")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Recusar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleOpenResponse("accept")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aceitar
                    </Button>
                  </>
                )}
                {isProfessional && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Cancelar orçamento
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-muted/30 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground text-center">
              Enviado em{" "}
              {format(new Date(quote.created_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Response Dialog */}
      <AlertDialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {responseType === "accept" ? "Aceitar orçamento" : "Recusar orçamento"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {responseType === "accept"
                ? "Ao aceitar, você confirma interesse neste orçamento. O profissional será notificado."
                : "Você pode adicionar uma mensagem explicando o motivo da recusa."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Adicionar mensagem (opcional)..."
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSubmitResponse();
              }}
              disabled={isSubmitting}
              className={cn(
                responseType === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : responseType === "accept" ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              {responseType === "accept" ? "Aceitar" : "Recusar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este orçamento? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Cancelar orçamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
