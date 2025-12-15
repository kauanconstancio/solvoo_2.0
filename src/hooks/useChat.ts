import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string | null;
  last_message_at: string;
  created_at: string;
  // Joined data
  other_user?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  service?: {
    id: string;
    title: string;
    images: string[] | null;
  } | null;
  last_message?: Message;
  unread_count?: number;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each conversation
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.client_id === user.id ? conv.professional_id : conv.client_id;
          
          // Fetch other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', otherUserId)
            .maybeSingle();

          // Fetch service if exists
          let service = null;
          if (conv.service_id) {
            const { data: serviceData } = await supabase
              .from('services')
              .select('id, title, images')
              .eq('id', conv.service_id)
              .maybeSingle();
            service = serviceData;
          }

          // Fetch last message
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Fetch unread count (messages not sent by current user and not read)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          return {
            ...conv,
            other_user: profile || undefined,
            service,
            last_message: messages?.[0] || undefined,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as conversas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      // First delete all messages in the conversation
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete the conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      toast({
        title: 'Sucesso',
        description: 'Conversa excluída com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a conversa.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return { conversations, isLoading, refetch: fetchConversations, deleteConversation };
};

export const useMessages = (conversationId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mensagens.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });

      if (error) throw error;

      // Update conversation last_message_at
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

  return { messages, isLoading, sendMessage, refetch: fetchMessages };
};

export const useCreateConversation = () => {
  const { toast } = useToast();

  const createOrGetConversation = async (
    professionalId: string,
    serviceId?: string,
    autoMessage?: string
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para enviar mensagens.',
          variant: 'destructive',
        });
        return null;
      }

      if (user.id === professionalId) {
        toast({
          title: 'Erro',
          description: 'Você não pode iniciar uma conversa consigo mesmo.',
          variant: 'destructive',
        });
        return null;
      }

      // Check if conversation already exists between these two users (in either direction)
      const { data: existingConvAsClient } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', user.id)
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (existingConvAsClient) {
        // If auto message provided, send it to existing conversation
        if (autoMessage) {
          await supabase.from('messages').insert({
            conversation_id: existingConvAsClient.id,
            sender_id: user.id,
            content: autoMessage,
          });
          // Update last_message_at
          await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', existingConvAsClient.id);
        }
        return existingConvAsClient.id;
      }

      // Also check if user is the professional in an existing conversation
      const { data: existingConvAsProfessional } = await supabase
        .from('conversations')
        .select('id')
        .eq('professional_id', user.id)
        .eq('client_id', professionalId)
        .maybeSingle();

      if (existingConvAsProfessional) {
        if (autoMessage) {
          await supabase.from('messages').insert({
            conversation_id: existingConvAsProfessional.id,
            sender_id: user.id,
            content: autoMessage,
          });
          await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', existingConvAsProfessional.id);
        }
        return existingConvAsProfessional.id;
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          client_id: user.id,
          professional_id: professionalId,
          service_id: serviceId || null,
        })
        .select('id')
        .single();

      if (convError) throw convError;

      // Send auto message if provided
      if (autoMessage && newConv) {
        await supabase.from('messages').insert({
          conversation_id: newConv.id,
          sender_id: user.id,
          content: autoMessage,
        });
      }

      return newConv.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a conversa.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return { createOrGetConversation };
};
