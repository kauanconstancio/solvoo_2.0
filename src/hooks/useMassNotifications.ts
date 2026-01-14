import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MassNotification {
  id: string;
  title: string;
  message: string;
  target_type: string;
  target_segment: any;
  sent_by: string;
  sent_at: string;
  recipients_count: number;
  created_at: string;
}

export interface SendMassNotificationData {
  title: string;
  message: string;
  target_type: 'all' | 'clients' | 'professionals';
}

export const useMassNotifications = () => {
  const [notifications, setNotifications] = useState<MassNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('mass_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching mass notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMassNotification = async (data: SendMassNotificationData) => {
    try {
      setIsSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get target users based on type
      let query = supabase.from('profiles').select('user_id');
      
      if (data.target_type === 'clients') {
        query = query.eq('account_type', 'cliente');
      } else if (data.target_type === 'professionals') {
        query = query.eq('account_type', 'profissional');
      }

      const { data: users, error: usersError } = await query;
      if (usersError) throw usersError;

      const userIds = users?.map(u => u.user_id) || [];

      // Create individual notifications
      const notificationsToInsert = userIds.map(userId => ({
        user_id: userId,
        type: 'system',
        title: data.title,
        message: data.message,
        data: { mass_notification: true }
      }));

      if (notificationsToInsert.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notificationsToInsert);

        if (notifError) throw notifError;
      }

      // Record the mass notification
      const { error: massError } = await supabase
        .from('mass_notifications')
        .insert({
          title: data.title,
          message: data.message,
          target_type: data.target_type,
          sent_by: user.id,
          recipients_count: userIds.length
        });

      if (massError) throw massError;

      toast.success(`Notificação enviada para ${userIds.length} usuários!`);
      await fetchNotifications();
      return true;
    } catch (err: any) {
      console.error('Error sending mass notification:', err);
      toast.error('Erro ao enviar notificação');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    isLoading,
    isSending,
    sendMassNotification,
    refetch: fetchNotifications
  };
};
