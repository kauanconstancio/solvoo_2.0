import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReplyToMessage {
  id: string;
  content: string;
  sender_id: string;
  message_type?: string | null;
  file_name?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  message_type?: string;
  file_url?: string | null;
  file_name?: string | null;
  reply_to_id?: string | null;
  reply_to?: ReplyToMessage | null;
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
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has cleared this conversation
      const { data: clearance } = await supabase
        .from('conversation_clearances')
        .select('cleared_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

      const userClearedAt = clearance?.cleared_at || null;
      setClearedAt(userClearedAt);

      // Build query with optional filter
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (userClearedAt) {
        query = query.gt('created_at', userClearedAt);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch reply_to messages for those that have replies
      const messagesWithReplies = await Promise.all(
        (data || []).map(async (msg) => {
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
      
      setMessages(messagesWithReplies);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

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

  const sendFile = async (file: File) => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      // Determine message type based on file type
      const isImage = file.type.startsWith('image/');
      const messageType = isImage ? 'image' : 'file';

      // Send message with file
      await sendMessage(
        isImage ? '📷 Imagem' : `📎 ${file.name}`,
        messageType,
        publicUrl,
        file.name
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

  const clearConversation = async () => {
    if (!conversationId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upsert clearance record
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

      // Clear local messages state
      setMessages([]);
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

  return { messages, isLoading, sendMessage, sendFile, refetch: fetchMessages, clearConversation };
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
