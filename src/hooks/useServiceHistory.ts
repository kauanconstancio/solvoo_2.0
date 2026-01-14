import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceHistoryItem {
  id: string;
  client_id: string;
  service_id: string | null;
  professional_id: string;
  quote_id: string | null;
  appointment_id: string | null;
  service_title: string;
  service_category: string | null;
  amount_paid: number;
  status: string;
  completed_at: string;
  created_at: string;
  professional?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  service?: {
    images: string[] | null;
  };
}

export const useServiceHistory = () => {
  const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // First get history from service_history table
      const { data: historyData, error: historyError } = await supabase
        .from('service_history')
        .select('*')
        .eq('client_id', user.id)
        .order('completed_at', { ascending: false });

      if (historyError) throw historyError;

      // Get completed quotes as fallback/alternative source
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          title,
          price,
          status,
          completed_at,
          professional_id,
          client_id,
          service_id,
          services:service_id (
            category,
            images
          )
        `)
        .eq('client_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (quotesError) throw quotesError;

      // Get professional profiles
      const professionalIds = [
        ...new Set([
          ...(historyData || []).map(h => h.professional_id),
          ...(quotesData || []).map(q => q.professional_id)
        ])
      ];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', professionalIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine and deduplicate
      const combinedHistory: ServiceHistoryItem[] = [];
      const seenQuoteIds = new Set<string>();

      // Add from service_history table
      (historyData || []).forEach(item => {
        if (item.quote_id) seenQuoteIds.add(item.quote_id);
        combinedHistory.push({
          ...item,
          professional: profileMap.get(item.professional_id)
        });
      });

      // Add from quotes that aren't in service_history
      (quotesData || []).forEach(quote => {
        if (!seenQuoteIds.has(quote.id)) {
          combinedHistory.push({
            id: quote.id,
            client_id: quote.client_id,
            service_id: quote.service_id,
            professional_id: quote.professional_id,
            quote_id: quote.id,
            appointment_id: null,
            service_title: quote.title,
            service_category: (quote.services as any)?.category || null,
            amount_paid: quote.price,
            status: 'completed',
            completed_at: quote.completed_at || new Date().toISOString(),
            created_at: quote.completed_at || new Date().toISOString(),
            professional: profileMap.get(quote.professional_id),
            service: quote.services as any
          });
        }
      });

      // Sort by completed_at
      combinedHistory.sort((a, b) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );

      setHistory(combinedHistory);
    } catch (err: any) {
      console.error('Error fetching service history:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { history, isLoading, error, refetch: fetchHistory };
};
