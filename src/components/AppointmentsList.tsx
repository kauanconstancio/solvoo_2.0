import { useEffect, useState } from "react";
import { format, parseISO, isToday, isTomorrow, isThisWeek, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Loader2 } from "lucide-react";
import { Appointment, useAppointments } from "@/hooks/useAppointments";
import { AppointmentCard } from "./AppointmentCard";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AppointmentsListProps {
  conversationId?: string;
  compact?: boolean;
}

export function AppointmentsList({ conversationId, compact = false }: AppointmentsListProps) {
  const { appointments, isLoading } = useAppointments(conversationId);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
      </div>
    );
  }

  if (!currentUserId) return null;

  // Group appointments by date
  const groupAppointments = (apts: Appointment[]) => {
    const today: Appointment[] = [];
    const tomorrow: Appointment[] = [];
    const thisWeek: Appointment[] = [];
    const later: Appointment[] = [];
    const past: Appointment[] = [];

    apts.forEach((apt) => {
      const date = parseISO(apt.scheduled_date + 'T12:00:00');
      if (isAfter(new Date(), parseISO(`${apt.scheduled_date}T${apt.scheduled_time}`))) {
        past.push(apt);
      } else if (isToday(date)) {
        today.push(apt);
      } else if (isTomorrow(date)) {
        tomorrow.push(apt);
      } else if (isThisWeek(date)) {
        thisWeek.push(apt);
      } else {
        later.push(apt);
      }
    });

    return { today, tomorrow, thisWeek, later, past };
  };

  const activeAppointments = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "completed"
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === "cancelled" || a.status === "completed"
  );

  if (compact) {
    return (
      <div className="space-y-2">
        {activeAppointments.slice(0, 3).map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            currentUserId={currentUserId}
            compact
          />
        ))}
        {activeAppointments.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{activeAppointments.length - 3} agendamento(s)
          </p>
        )}
      </div>
    );
  }

  const grouped = groupAppointments(activeAppointments);

  const renderGroup = (title: string, items: Appointment[]) => {
    if (!items.length) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
        {items.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upcoming">
          Próximos ({activeAppointments.length})
        </TabsTrigger>
        <TabsTrigger value="history">
          Histórico ({pastAppointments.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="space-y-6 mt-4">
        {activeAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum agendamento próximo</p>
          </div>
        ) : (
          <>
            {renderGroup("Hoje", grouped.today)}
            {renderGroup("Amanhã", grouped.tomorrow)}
            {renderGroup("Esta semana", grouped.thisWeek)}
            {renderGroup("Próximos", grouped.later)}
          </>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-3 mt-4">
        {pastAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum histórico</p>
          </div>
        ) : (
          pastAppointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              currentUserId={currentUserId}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
