import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message, ReplyToMessage } from './useChat';
import { Quote } from './useQuotes';
import { compressImage, isImageFile } from '@/lib/imageCompression';

export type ChatItemType = 'message' | 'quote';

export interface ChatItem {
  type: ChatItemType;
  id: string;
  created_at: string;
  data: Message | Quote;
}

interface UseChatItemsReturn {
  items: ChatItem[];
  messages: Message[];
  quotes: Quote[];
  isLoading: boolean;
  sendMessage: (
    content: string,
    messageType?: string,
    fileUrl?: string,
    fileName?: string,
    replyToId?: string
  ) => Promise<void>;
  sendFile: (file: File) => Promise<void>;
  clearConversation: () => Promise<boolean>;
  createQuote: (
    clientId: string,
    title: string,
    description: string,
    price: number,
    validityDays: number,
    serviceId?: string,
    scheduledDate?: string,
    scheduledTime?: string
  ) => Promise<boolean>;
  respondToQuote: (
    quoteId: string,
    status: 'accepted' | 'rejected',
    response?: string
  ) => Promise<boolean>;
  cancelQuote: (quoteId: string) => Promise<boolean>;
  completeService: (quote: Quote, clientName: string) => Promise<boolean>;
  initiatePayment: (quote: Quote) => Promise<PixPaymentData | null>;
  checkUserCpf: () => Promise<string | null>;
  refetch: () => Promise<void>;
}

interface PixPaymentData {
  pixId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
  expiresAt: string;
  quoteTitle: string;
  quotePrice: number;
}

const PLATFORM_FEE_RATE = 0.10;

export const useChatItems = (conversationId: string | undefined): UseChatItemsReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUserId(user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch both messages and quotes simultaneously
  const fetchAll = useCallback(async () => {
    if (!conversationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      if (!userId) {
        setMessages([]);
        setQuotes([]);
        setClearedAt(null);
        setIsLoading(false);
        return;
      }

      // Fetch clearance, messages and quotes in parallel
      const [clearanceResult, messagesResult, quotesResult] = await Promise.all([
        supabase
          .from('conversation_clearances')
          .select('cleared_at')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true }),
        supabase
          .from('quotes')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true }),
      ]);

      const userClearedAt = clearanceResult.data?.cleared_at || null;
      setClearedAt(userClearedAt);

      // Process messages
      if (messagesResult.error) throw messagesResult.error;
      
      let filteredMessages = messagesResult.data || [];
      if (userClearedAt) {
        filteredMessages = filteredMessages.filter(
          (msg) => new Date(msg.created_at) > new Date(userClearedAt)
        );
      }

      // Fetch reply_to messages for those that have replies
      const messagesWithReplies = await Promise.all(
        filteredMessages.map(async (msg) => {
          if (msg.reply_to_id) {
            const { data: replyMsg } = await supabase
              .from('messages')
              .select('id, content, sender_id, message_type, file_name')
              .eq('id', msg.reply_to_id)
              .maybeSingle();
            return { ...msg, reply_to: replyMsg };
          }
          return msg;
        })
      );

      // Process quotes
      if (quotesResult.error) throw quotesResult.error;

      let filteredQuotes = quotesResult.data || [];
      if (userClearedAt) {
        filteredQuotes = filteredQuotes.filter(
          (q) => new Date(q.created_at) > new Date(userClearedAt)
        );
      }

      // Pre-fetch appointments for these quotes (so they show inside the QuoteCard)
      const appointmentByQuoteId = new Map<
        string,
        { id: string; quote_id: string; scheduled_date: string; scheduled_time: string; status: string; location: string | null }
      >();

      if (filteredQuotes.length > 0) {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, quote_id, scheduled_date, scheduled_time, status, location')
          .in('quote_id', filteredQuotes.map((q) => q.id));

        if (appointmentsError) throw appointmentsError;

        (appointmentsData || []).forEach((apt) => {
          appointmentByQuoteId.set(apt.quote_id, apt as any);
        });
      }

      // Enrich quotes with service, professional and appointment data
      const enrichedQuotes = await Promise.all(
        filteredQuotes.map(async (quote) => {
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

          const appointment = appointmentByQuoteId.get(quote.id) ?? null;

          return {
            ...quote,
            service,
            professional,
            appointment,
          } as Quote;
        })
      );

      setMessages(messagesWithReplies);
      setQuotes(enrichedQuotes);
    } catch (error: any) {
      console.error('Error fetching chat items:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a conversa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, userId, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Subscribe to realtime updates for messages
  useEffect(() => {
    if (!conversationId) return;

    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch reply_to message if exists
          if (newMessage.reply_to_id) {
            const { data: replyMsg } = await supabase
              .from('messages')
              .select('id, content, sender_id, message_type, file_name')
              .eq('id', newMessage.reply_to_id)
              .maybeSingle();
            newMessage.reply_to = replyMsg;
          }
          
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id
                ? { ...msg, read_at: updatedMessage.read_at }
                : msg
            )
          );
        }
      )
      .subscribe();

    const quotesChannel = supabase
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
          fetchAll();
        }
      )
      .subscribe();

    const appointmentsChannel = supabase
      .channel(`appointments:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(quotesChannel);
      supabase.removeChannel(appointmentsChannel);
    };
  }, [conversationId, fetchAll]);

  // Combine and sort items
  const items = useMemo((): ChatItem[] => {
    const combined: ChatItem[] = [
      ...messages.map((m) => ({
        type: 'message' as const,
        id: m.id,
        created_at: m.created_at,
        data: m,
      })),
      ...quotes.map((q) => ({
        type: 'quote' as const,
        id: q.id,
        created_at: q.created_at,
        data: q,
      })),
    ];

    return combined.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages, quotes]);

  // Message actions
  const sendMessage = async (
    content: string,
    messageType: string = 'text',
    fileUrl?: string,
    fileName?: string,
    replyToId?: string
  ) => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type: messageType,
        file_url: fileUrl || null,
        file_name: fileName || null,
        reply_to_id: replyToId || null,
      });

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    }
  };

  const sendFile = async (file: File) => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const isImage = isImageFile(file);
      let fileToUpload: File | Blob = file;
      let fileExt = file.name.split('.').pop();

      // Compress image before upload
      if (isImage) {
        try {
          const compressedBlob = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
            maxSizeMB: 2,
          });
          fileToUpload = compressedBlob;
          fileExt = 'jpg';
        } catch (compressionError) {
          console.warn('Image compression failed, using original:', compressionError);
        }
      }

      const filePath = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, fileToUpload, {
          contentType: isImage ? 'image/jpeg' : file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      const messageType = isImage ? 'image' : 'file';

      await sendMessage(
        isImage ? '📷 Imagem' : `📎 ${file.name}`,
        messageType,
        publicUrl,
        isImage ? `${Date.now()}.jpg` : file.name
      );
    } catch (error: any) {
      console.error('Error sending file:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const clearConversation = async (): Promise<boolean> => {
    if (!conversationId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('conversation_clearances')
        .upsert(
          {
            user_id: user.id,
            conversation_id: conversationId,
            cleared_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,conversation_id' }
        );

      if (error) throw error;

      setMessages([]);
      setQuotes([]);
      setClearedAt(new Date().toISOString());

      toast({
        title: 'Conversa limpa',
        description: 'As mensagens foram ocultadas para você.',
      });

      return true;
    } catch (error: any) {
      console.error('Error clearing conversation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar a conversa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Quote actions
  const createQuote = async (
    clientId: string,
    title: string,
    description: string,
    price: number,
    validityDays: number,
    serviceId?: string,
    scheduledDate?: string,
    scheduledTime?: string
  ): Promise<boolean> => {
    if (!conversationId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      const { data: quoteData, error } = await supabase
        .from('quotes')
        .insert({
          conversation_id: conversationId,
          service_id: serviceId || null,
          professional_id: user.id,
          client_id: clientId,
          title,
          description,
          price,
          validity_days: validityDays,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create appointment linked to this quote
      if (quoteData && scheduledDate && scheduledTime) {
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            client_id: clientId,
            professional_id: user.id,
            service_id: serviceId || null,
            conversation_id: conversationId,
            quote_id: quoteData.id,
            title,
            description,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            status: 'pending',
            professional_confirmed: true,
            client_confirmed: false,
          });

        if (appointmentError) throw appointmentError;
      }

      // Ensure UI immediately shows the appointment info
      await fetchAll();

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

      // Keep linked appointment in sync
      if (status === 'accepted') {
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({
            status: 'confirmed',
            client_confirmed: true,
          })
          .eq('quote_id', quoteId);

        if (appointmentError) throw appointmentError;
      } else {
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('quote_id', quoteId);

        if (appointmentError) throw appointmentError;
      }

      await fetchAll();

      toast({
        title: status === 'accepted' ? 'Orçamento aceito' : 'Orçamento recusado',
        description:
          status === 'accepted'
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

      // Cancel any linked appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('quote_id', quoteId);

      if (appointmentError) throw appointmentError;

      await fetchAll();

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

      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      if (quoteError) throw quoteError;

      toast({
        title: 'Serviço finalizado!',
        description: 'Aguardando confirmação do cliente para liberação do pagamento.',
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

  const checkUserCpf = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('cpf')
        .eq('user_id', user.id)
        .single();

      return profile?.cpf || null;
    } catch (error) {
      console.error('Error checking CPF:', error);
      return null;
    }
  };

  const initiatePayment = async (quote: Quote): Promise<PixPaymentData | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { quoteId: quote.id },
      });

      if (error) throw error;

      if (data?.brCode) {
        return data as PixPaymentData;
      } else {
        throw new Error('Dados do PIX não recebidos');
      }
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível iniciar o pagamento.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    items,
    messages,
    quotes,
    isLoading,
    sendMessage,
    sendFile,
    clearConversation,
    createQuote,
    respondToQuote,
    cancelQuote,
    completeService,
    initiatePayment,
    checkUserCpf,
    refetch: fetchAll,
  };
};
