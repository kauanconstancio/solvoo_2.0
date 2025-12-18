import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

export interface Quote {
  id: string;
  conversation_id: string;
  service_id: string | null;
  professional_id: string;
  client_id: string;
  title: string;
  description: string | null;
  price: number;
  validity_days: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  client_response: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  completed_at: string | null;
  responded_at: string | null;
  // Joined data
  service?: {
    id: string;
    title: string;
  } | null;
  professional?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useQuotes = (conversationId: string | undefined) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuotes = useCallback(async () => {
    if (!conversationId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich quotes with service and professional data
      const enrichedQuotes = await Promise.all(
        (data || []).map(async (quote) => {
          let service = null;
          if (quote.service_id) {
            const { data: serviceData } = await supabase
              .from('services')
              .select('id, title')
              .eq('id', quote.service_id)
              .maybeSingle();
            service = serviceData;
          }

          const { data: professional } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', quote.professional_id)
            .maybeSingle();

          return {
            ...quote,
            service,
            professional,
          } as Quote;
        })
      );

      setQuotes(enrichedQuotes);
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`quotes:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchQuotes]);

  const createQuote = async (
    clientId: string,
    title: string,
    description: string,
    price: number,
    validityDays: number,
    serviceId?: string
  ): Promise<boolean> => {
    if (!conversationId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      const { error } = await supabase.from('quotes').insert({
        conversation_id: conversationId,
        service_id: serviceId || null,
        professional_id: user.id,
        client_id: clientId,
        title,
        description,
        price,
        validity_days: validityDays,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Orçamento enviado',
        description: 'Seu orçamento foi enviado com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o orçamento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const respondToQuote = async (
    quoteId: string,
    status: 'accepted' | 'rejected',
    response?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          status,
          client_response: response || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: status === 'accepted' ? 'Orçamento aceito' : 'Orçamento recusado',
        description: status === 'accepted' 
          ? 'Você aceitou o orçamento. O profissional será notificado.'
          : 'Você recusou o orçamento.',
      });

      return true;
    } catch (error: any) {
      console.error('Error responding to quote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível responder ao orçamento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelQuote = async (quoteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'cancelled' })
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: 'Orçamento cancelado',
        description: 'O orçamento foi cancelado.',
      });

      return true;
    } catch (error: any) {
      console.error('Error cancelling quote:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o orçamento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const completeService = async (quote: Quote, clientName: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Mark quote as completed
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ 
          completed_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      if (quoteError) throw quoteError;

      // Create wallet transaction
      const fee = quote.price * PLATFORM_FEE_RATE;
      const netAmount = quote.price - fee;

      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          quote_id: quote.id,
          type: 'credit',
          amount: quote.price,
          fee,
          net_amount: netAmount,
          description: `Pagamento - ${quote.title}`,
          customer_name: clientName,
          status: 'completed',
        });

      if (transactionError) throw transactionError;

      toast({
        title: 'Serviço finalizado!',
        description: `R$ ${netAmount.toFixed(2)} foram adicionados à sua carteira`,
      });

      return true;
    } catch (error: any) {
      console.error('Error completing service:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar o serviço.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    quotes,
    isLoading,
    createQuote,
    respondToQuote,
    cancelQuote,
    completeService,
    refetch: fetchQuotes,
  };
};
