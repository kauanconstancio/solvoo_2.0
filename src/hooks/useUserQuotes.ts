import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserQuote {
  id: string;
  conversation_id: string;
  service_id: string | null;
  professional_id: string;
  client_id: string;
  title: string;
  description: string | null;
  price: number;
  validity_days: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'completed';
  client_response: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  completed_at: string | null;
  responded_at: string | null;
  client_confirmed: boolean;
  client_confirmed_at: string | null;
  // Joined data
  service?: {
    id: string;
    title: string;
    images: string[];
  } | null;
  professional?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  client?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useUserQuotes = () => {
  const [quotes, setQuotes] = useState<UserQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch quotes where user is either professional or client
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .or(`professional_id.eq.${user.id},client_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Enrich quotes with service, professional and client data
      const enrichedQuotes = await Promise.all(
        (data || []).map(async (quote) => {
          let service = null;
          if (quote.service_id) {
            const { data: serviceData } = await supabase
              .from('services')
              .select('id, title, images')
              .eq('id', quote.service_id)
              .maybeSingle();
            service = serviceData;
          }

          const { data: professional } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', quote.professional_id)
            .maybeSingle();

          const { data: client } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', quote.client_id)
            .maybeSingle();

          return {
            ...quote,
            service,
            professional,
            client,
          } as UserQuote;
        })
      );

      setQuotes(enrichedQuotes);
    } catch (error: any) {
      console.error('Error fetching user quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-quotes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
        },
        (payload) => {
          const record = payload.new as any || payload.old as any;
          if (record && (record.professional_id === userId || record.client_id === userId)) {
            fetchQuotes();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchQuotes]);

  // Categorize quotes
  const inProgress = quotes.filter(q => 
    q.status === 'accepted' && !q.completed_at
  );

  const awaitingConfirmation = quotes.filter(q => 
    q.status === 'accepted' && q.completed_at && !q.client_confirmed
  );

  const completed = quotes.filter(q => 
    q.status === 'accepted' && q.client_confirmed
  );

  const pending = quotes.filter(q => 
    q.status === 'pending'
  );

  const cancelled = quotes.filter(q => 
    q.status === 'cancelled' || q.status === 'rejected' || q.status === 'expired'
  );

  return {
    quotes,
    inProgress,
    awaitingConfirmation,
    completed,
    pending,
    cancelled,
    isLoading,
    userId,
    refetch: fetchQuotes,
  };
};
