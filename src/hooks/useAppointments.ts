import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Appointment {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string | null;
  conversation_id: string | null;
  quote_id: string | null;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  client_confirmed: boolean;
  professional_confirmed: boolean;
  reminder_sent: boolean;
  reminder_24h_sent: boolean;
  notes: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  professional?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  service?: {
    title: string;
  };
}

interface CreateAppointmentData {
  client_id: string;
  professional_id: string;
  service_id?: string;
  conversation_id?: string;
  quote_id?: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  location?: string;
  notes?: string;
}

export function useAppointments(conversationId?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      let query = supabase
        .from("appointments")
        .select("*")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (conversationId) {
        query = query.eq("conversation_id", conversationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles for each appointment
      const enrichedAppointments = await Promise.all(
        (data || []).map(async (apt) => {
          const [clientProfile, professionalProfile, serviceData] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", apt.client_id)
              .maybeSingle(),
            supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", apt.professional_id)
              .maybeSingle(),
            apt.service_id
              ? supabase
                  .from("services")
                  .select("title")
                  .eq("id", apt.service_id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...apt,
            client: clientProfile.data,
            professional: professionalProfile.data,
            service: serviceData.data,
          } as Appointment;
        })
      );

      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  const createAppointment = async (data: CreateAppointmentData) => {
    try {
      const { error } = await supabase.from("appointments").insert({
        ...data,
        professional_confirmed: true, // Professional creates, so they confirm
      });

      if (error) throw error;

      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Erro ao criar agendamento",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
      return false;
    }
  };

  const confirmAppointment = async (appointmentId: string, isClient: boolean) => {
    try {
      const updateData = isClient
        ? { client_confirmed: true }
        : { professional_confirmed: true };

      const { error } = await supabase
        .from("appointments")
        .update({
          ...updateData,
          status: "confirmed",
        })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento confirmado",
        description: "O agendamento foi confirmado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast({
        title: "Erro ao confirmar",
        description: "Não foi possível confirmar o agendamento.",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado.",
      });

      return true;
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
      return false;
    }
  };

  const rescheduleAppointment = async (
    appointmentId: string,
    newDate: string,
    newTime: string
  ) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_date: newDate,
          scheduled_time: newTime,
          status: "pending",
          client_confirmed: false,
          professional_confirmed: true,
        })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento reagendado",
        description: "Aguardando confirmação do cliente.",
      });

      return true;
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast({
        title: "Erro ao reagendar",
        description: "Não foi possível reagendar.",
        variant: "destructive",
      });
      return false;
    }
  };

  const completeAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Serviço concluído",
        description: "O serviço foi marcado como concluído.",
      });

      return true;
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir o serviço.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    appointments,
    isLoading,
    createAppointment,
    confirmAppointment,
    cancelAppointment,
    rescheduleAppointment,
    completeAppointment,
    refetch: fetchAppointments,
  };
}
