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
  MapPin,
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
import { AcceptQuoteWithScheduleDialog } from "./AcceptQuoteWithScheduleDialog";

interface QuoteCardProps {
  quote: Quote;
  currentUserId: string;
  clientName?: string;
  onAccept: (quoteId: string, response?: string, scheduledDate?: string, scheduledTime?: string) => Promise<boolean>;
  onReject: (quoteId: string, response?: string) => Promise<boolean>;
  onCancel: (quoteId: string) => Promise<boolean>;
  onComplete?: (quote: Quote, clientName: string) => Promise<boolean>;
  onConfirmCompletion?: (quote: Quote) => Promise<boolean>;
  appointment?: {
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    location?: string | null;
  } | null;
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
  clientName = 'Cliente',
  onAccept,
  onReject,
  onCancel,
  onComplete,
  onConfirmCompletion,
  appointment,
}: QuoteCardProps) => {
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState<"accept" | "reject" | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const isProfessional = currentUserId === quote.professional_id;
  const isClient = currentUserId === quote.client_id;
  const isExpired = isPast(new Date(quote.expires_at)) && quote.status === "pending";
  const isCompleted = quote.completed_at !== null;
  const isClientConfirmed = quote.client_confirmed === true;
  
  const effectiveStatus = isExpired ? "expired" : quote.status;
  const statusInfo = statusConfig[effectiveStatus];
  const StatusIcon = statusInfo.icon;

  // Determine if the quote needs attention from the current user
  const needsClientAction = isClient && (
    (effectiveStatus === "pending") || // Client needs to accept/reject
    (isCompleted && !isClientConfirmed) // Client needs to confirm and pay
  );
  const needsAttention = needsClientAction;

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
    try {
      const success =
        responseType === "accept"
          ? await onAccept(quote.id, responseMessage)
          : await onReject(quote.id, responseMessage);

      if (success) {
        setShowResponseDialog(false);
      }
    } catch (err) {
      console.error("Error submitting quote response:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      const success = await onCancel(quote.id);
      if (success) {
        setShowCancelDialog(false);
      }
    } catch (err) {
      console.error("Error cancelling quote:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    setIsSubmitting(true);
    try {
      const success = await onComplete(quote, clientName);
      if (success) {
        setShowCompleteDialog(false);
      }
    } catch (err) {
      console.error("Error completing service:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!onConfirmCompletion) return;
    setIsSubmitting(true);
    try {
      const success = await onConfirmCompletion(quote);
      if (success) {
        setShowConfirmDialog(false);
      }
    } catch (err) {
      console.error("Error confirming completion:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto my-4 animate-fade-in">
        <div className={cn(
          "bg-card border rounded-2xl overflow-hidden shadow-sm transition-all duration-500",
          needsAttention 
            ? "border-primary/40 animate-gentle-pulse" 
            : "border-border/50"
        )}>
          {/* Header */}
          <div className={cn(
            "px-4 py-3 border-b border-border/50",
            needsAttention ? "bg-primary/10" : "bg-primary/5"
          )}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  needsAttention ? "bg-primary/20" : "bg-primary/10"
                )}>
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-sm">Orçamento</span>
                  {needsAttention && (
                    <p className="text-xs text-primary font-medium animate-[pulse_3s_ease-in-out_infinite]">
                      Ação necessária
                    </p>
                  )}
                </div>
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

            {/* Appointment Info */}
            {appointment && (
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 mt-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Agendamento</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    {format(new Date(appointment.scheduled_date), "EEEE, dd 'de' MMMM", { locale: ptBR })} às {appointment.scheduled_time}
                  </p>
                  {appointment.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {appointment.location}
                    </p>
                  )}
                </div>
              </div>
            )}

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
                      onClick={() => setShowScheduleDialog(true)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Aceitar e Agendar
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

            {/* Complete Service Button for Accepted Quotes (Professional) */}
            {effectiveStatus === "accepted" && isProfessional && !isCompleted && onComplete && (
              <div className="pt-2">
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => setShowCompleteDialog(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Finalizar Serviço
                </Button>
              </div>
            )}

            {/* Awaiting Client Confirmation Badge (Professional view) */}
            {isCompleted && !isClientConfirmed && isProfessional && (
              <div className="pt-2">
                <div className="flex items-center justify-center gap-2 p-2 bg-yellow-500/10 rounded-lg text-yellow-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Aguardando confirmação do cliente</span>
                </div>
              </div>
            )}

            {/* Client Confirmation Button */}
            {isCompleted && !isClientConfirmed && isClient && onConfirmCompletion && (
              <div className="pt-2">
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setShowConfirmDialog(true)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Pagar e Confirmar Serviço
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Ao confirmar, você será redirecionado para o pagamento
                </p>
              </div>
            )}

            {/* Fully Completed Badge */}
            {isCompleted && isClientConfirmed && (
              <div className="pt-2">
                <div className="flex items-center justify-center gap-2 p-2 bg-green-500/10 rounded-lg text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Serviço Finalizado e Pago</span>
                </div>
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

      {/* Complete Service Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Ao finalizar, o cliente será notificado para confirmar o recebimento do serviço. 
              O pagamento de R$ {(quote.price * 0.9).toFixed(2)} (já descontada a taxa de 10%) 
              será liberado após a confirmação do cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleComplete();
              }}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirmar Finalização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pagar pelo serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, você será redirecionado para a página de pagamento.
              O valor de R$ {quote.price.toFixed(2)} será cobrado e liberado ao profissional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmCompletion();
              }}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Ir para Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept with Schedule Dialog */}
      <AcceptQuoteWithScheduleDialog
        quote={quote}
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onAccept={onAccept}
      />
    </>
  );
};
