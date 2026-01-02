import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Car, Clock, ExternalLink, MapPin, MessageCircle, Navigation, User } from "lucide-react";

import { AddressMapPreview } from "@/components/AddressMapPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserQuote } from "@/hooks/useUserQuotes";

interface AppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: UserQuote | null;
  userId: string | null;
}

export function AppointmentDetailsDialog({ open, onOpenChange, quote, userId }: AppointmentDetailsDialogProps) {
  const navigate = useNavigate();

  const statusConfig = useMemo(() => {
    if (!quote) return { label: "", className: "", dotColor: "bg-muted-foreground" };

    if (quote.client_confirmed) {
      return {
        label: "Concluído",
        className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        dotColor: "bg-green-500",
      };
    }
    if (quote.completed_at && !quote.client_confirmed) {
      return {
        label: "Aguardando Confirmação",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dotColor: "bg-amber-500",
      };
    }
    if (quote.status === "accepted") {
      return {
        label: "Em Andamento",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        dotColor: "bg-blue-500",
      };
    }
    if (quote.status === "pending") {
      return {
        label: "Pendente",
        className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        dotColor: "bg-yellow-500",
      };
    }
    if (quote.status === "cancelled") {
      return { label: "Cancelado", className: "bg-muted text-muted-foreground", dotColor: "bg-muted-foreground" };
    }
    if (quote.status === "rejected") {
      return {
        label: "Recusado",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        dotColor: "bg-red-500",
      };
    }
    if (quote.status === "expired") {
      return { label: "Expirado", className: "bg-muted text-muted-foreground", dotColor: "bg-muted-foreground" };
    }

    return { label: "", className: "", dotColor: "bg-muted-foreground" };
  }, [quote]);

  if (!quote) return null;

  const isProfessional = quote.professional_id === userId;
  const otherPerson = isProfessional ? quote.client : quote.professional;
  const roleLabel = isProfessional ? "Cliente" : "Profissional";

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);

  const handleChat = () => {
    onOpenChange(false);
    navigate(`/chat/${quote.conversation_id}`);
  };

  const handleViewService = () => {
    onOpenChange(false);
    if (quote.service_id) navigate(`/servico/${quote.service_id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          "p-0 gap-0 overflow-hidden w-[calc(100vw-1.25rem)] sm:w-full max-w-lg rounded-2xl sm:rounded-lg h-[92dvh] sm:h-auto sm:max-h-[90vh]"
        }
      >
        {/* Header (sticky) */}
        <DialogHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 sm:px-6 py-3">
          <div className="flex items-start justify-between gap-3 pr-10">
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-semibold leading-tight">Detalhes do Serviço</DialogTitle>
              <p className="text-xs text-muted-foreground">Informações do agendamento e localização</p>
            </div>
            {statusConfig.label ? (
              <Badge className={`${statusConfig.className} text-[11px] px-2 py-0.5 font-medium whitespace-nowrap h-fit`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} mr-1.5`} />
                {statusConfig.label}
              </Badge>
            ) : null}
          </div>
        </DialogHeader>

        {/* Body (scroll) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
          {/* Person + Price */}
          <section className="rounded-xl border bg-card/50 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-background shadow-sm flex-shrink-0">
                <AvatarImage src={otherPerson?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {otherPerson?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
                <p className="text-sm font-semibold text-foreground truncate">{otherPerson?.full_name || "Usuário"}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-[11px] text-muted-foreground">Valor</p>
                <p className="text-base font-bold text-primary whitespace-nowrap leading-tight">{formatPrice(quote.price)}</p>
              </div>
            </div>
          </section>

          {/* Service */}
          <section className="space-y-1.5">
            <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug">{quote.title}</h3>
            {quote.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{quote.description}</p>
            ) : null}

            {quote.service ? (
              <Button variant="link" size="sm" className="h-auto p-0 text-primary text-sm gap-1" onClick={handleViewService}>
                <ExternalLink className="w-3.5 h-3.5" />
                Ver página do serviço
              </Button>
            ) : null}
          </section>

          <Separator />

          {/* Appointment */}
          {quote.appointment ? (
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Agendamento</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-primary mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">Data</p>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(`${quote.appointment.scheduled_date}T12:00:00`), "dd 'de' MMMM, yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">Horário</p>
                      <p className="text-sm font-medium text-foreground">{quote.appointment.scheduled_time}</p>
                    </div>
                  </div>
                </div>
              </div>

              {quote.appointment.location ? (
                <div className="space-y-2.5">
                  <div className="rounded-xl border bg-card/50 p-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">Local</p>
                        <p className="text-sm font-medium text-foreground break-words">{quote.appointment.location}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quote.appointment.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Abrir endereço no Google Maps em nova aba"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Abrir no Maps
                          </a>
                        </Button>

                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                          <a
                            href={`https://www.waze.com/ul?q=${encodeURIComponent(quote.appointment.location)}&navigate=yes`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Abrir endereço no Waze em nova aba"
                          >
                            <Car className="w-3.5 h-3.5" />
                            Waze
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <AddressMapPreview
                    address={quote.appointment.location}
                    className="h-44 sm:h-52 w-full rounded-xl border border-border shadow-sm"
                  />
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        {/* Footer (sticky actions) */}
        <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 sm:px-6 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:flex-1 gap-2" onClick={handleChat}>
              <MessageCircle className="w-4 h-4" />
              Abrir conversa
            </Button>

            {quote.service ? (
              <Button variant="default" className="w-full sm:flex-1 gap-2" onClick={handleViewService}>
                <ExternalLink className="w-4 h-4" />
                Ver serviço
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
