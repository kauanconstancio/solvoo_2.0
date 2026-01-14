import { format, parseISO, isAfter, isBefore, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Appointment, useAppointments } from "@/hooks/useAppointments";
import { useState } from "react";
import { RescheduleDialog } from "./RescheduleDialog";
import { AddressMapPreview } from "./AddressMapPreview";

interface AppointmentCardProps {
  appointment: Appointment;
  currentUserId: string;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: string }> = {
  awaiting_payment: { label: "Aguardando pagamento", variant: "secondary", icon: "💳" },
  pending: { label: "Aguardando confirmação", variant: "secondary" },
  confirmed: { label: "Confirmado", variant: "default", icon: "✅" },
  cancelled: { label: "Cancelado", variant: "destructive", icon: "❌" },
  completed: { label: "Concluído", variant: "outline", icon: "✓" },
};

export function AppointmentCard({ appointment, currentUserId, compact = false }: AppointmentCardProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { confirmAppointment, cancelAppointment, completeAppointment, confirmServiceCompletion } = useAppointments();
  
  const isClient = currentUserId === appointment.client_id;
  const isProfessional = currentUserId === appointment.professional_id;
  const otherParty = isClient ? appointment.professional : appointment.client;
  
  const scheduledDateTime = parseISO(
    `${appointment.scheduled_date}T${appointment.scheduled_time}`
  );
  const isPast = isBefore(scheduledDateTime, new Date());
  const isUpcoming = isAfter(scheduledDateTime, new Date()) && 
    isBefore(scheduledDateTime, addHours(new Date(), 24));
  
  const needsConfirmation = appointment.status === "pending" && 
    ((isClient && !appointment.client_confirmed) || 
     (isProfessional && !appointment.professional_confirmed));
  
  const isAwaitingPayment = appointment.status === "awaiting_payment";
  
  // Professional can mark as completed when service is confirmed and past
  const canComplete = isProfessional && 
    appointment.status === "confirmed" && 
    isPast;

  // Client can confirm completion (release payment) when status is "completed" but client hasn't confirmed yet
  const canConfirmCompletion = isClient && 
    appointment.status === "completed" && 
    !appointment.client_confirmed;

  const handleConfirmCompletion = async () => {
    setIsConfirming(true);
    try {
      await confirmServiceCompletion(appointment.id);
    } finally {
      setIsConfirming(false);
    }
  };

  const status = statusConfig[appointment.status] || statusConfig.pending;

  if (compact) {
    return (
      <Card className={`border-l-4 ${
        appointment.status === "confirmed" ? "border-l-primary" : 
        appointment.status === "cancelled" ? "border-l-destructive" :
        appointment.status === "awaiting_payment" ? "border-l-yellow-500" :
        "border-l-muted-foreground"
      }`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {format(parseISO(appointment.scheduled_date + 'T12:00:00'), "dd/MM", { locale: ptBR })}
              </span>
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{appointment.scheduled_time}</span>
            </div>
            <Badge 
              variant={status.variant} 
              className={`flex-shrink-0 text-xs ${isAwaitingPayment ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : ""}`}
            >
              {isAwaitingPayment ? "💳 Aguardando" : appointment.status === "pending" ? "Pendente" : status.label}
            </Badge>
          </div>
          <p className="text-sm font-medium mt-1 truncate">{appointment.title}</p>
          
          {isAwaitingPayment && isClient && (
            <div className="mt-2 p-2 bg-yellow-500/10 rounded text-xs text-yellow-700 dark:text-yellow-400">
              ⏳ Complete o pagamento para confirmar o agendamento
            </div>
          )}
          
          {needsConfirmation && (
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                className="h-7 text-xs flex-1"
                onClick={() => confirmAppointment(appointment.id, isClient)}
              >
                <Check className="h-3 w-3 mr-1" />
                Confirmar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs flex-1"
                onClick={() => cancelAppointment(appointment.id)}
              >
                <X className="h-3 w-3 mr-1" />
                Recusar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`transition-all ${
        isUpcoming ? "ring-2 ring-primary/50" : ""
      } ${appointment.status === "cancelled" ? "opacity-60" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherParty?.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{appointment.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {isClient ? "Profissional" : "Cliente"}: {otherParty?.full_name || "Usuário"}
                </p>
              </div>
            </div>
            <Badge 
              variant={status.variant}
              className={isAwaitingPayment ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : ""}
            >
              {status.icon && <span className="mr-1">{status.icon}</span>}
              {status.label}
            </Badge>
          </div>
          
          {/* Awaiting Payment Alert */}
          {isAwaitingPayment && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Aguardando pagamento</span>
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                {isClient 
                  ? "Complete o pagamento para confirmar este agendamento e reservar o horário."
                  : "O cliente ainda não realizou o pagamento. O horário será reservado após a confirmação."
                }
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(parseISO(appointment.scheduled_date + 'T12:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {appointment.scheduled_time} ({appointment.duration_minutes} min)
              </span>
            </div>
            {appointment.location && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.location}</span>
                </div>
                <AddressMapPreview 
                  address={appointment.location} 
                  className="h-32 rounded-lg"
                />
              </div>
            )}
          </div>

          {appointment.description && (
            <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              {appointment.description}
            </p>
          )}

          {isUpcoming && appointment.status === "confirmed" && (
            <div className="mt-3 flex items-center gap-2 text-sm text-primary bg-primary/10 p-2 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>Agendamento em menos de 24 horas!</span>
            </div>
          )}

          {canConfirmCompletion && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 p-2 rounded">
              <CheckCircle2 className="h-4 w-4" />
              <span>O profissional concluiu o serviço. Confirme para liberar o pagamento.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {needsConfirmation && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => confirmAppointment(appointment.id, isClient)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => cancelAppointment(appointment.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Recusar
                </Button>
              </>
            )}
            
            {isProfessional && appointment.status !== "cancelled" && appointment.status !== "completed" && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowReschedule(true)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reagendar
              </Button>
            )}

            {canComplete && (
              <Button 
                size="sm" 
                variant="default"
                onClick={() => completeAppointment(appointment.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Marcar como Concluído
              </Button>
            )}

            {canConfirmCompletion && (
              <Button 
                size="sm" 
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleConfirmCompletion}
                disabled={isConfirming}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {isConfirming ? "Liberando..." : "Confirmar e Liberar Pagamento"}
              </Button>
            )}

            {appointment.status !== "cancelled" && appointment.status !== "completed" && !needsConfirmation && (
              <Button 
                size="sm" 
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => cancelAppointment(appointment.id)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <RescheduleDialog
        open={showReschedule}
        onOpenChange={setShowReschedule}
        appointmentId={appointment.id}
        currentDate={appointment.scheduled_date}
        currentTime={appointment.scheduled_time}
      />
    </>
  );
}
