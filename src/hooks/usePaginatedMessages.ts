import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message, ReplyToMessage } from '@/hooks/useChat';

const PAGE_SIZE = 50;

export const usePaginatedMessages = (conversationId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const oldestMessageRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Get user ID
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

  // Fetch messages with replies
  const enrichWithReplies = useCallback(async (msgs: any[]): Promise<Message[]> => {
    const messagesWithReplies = await Promise.all(
      msgs.map(async (msg) => {
        if (msg.reply_to_id) {
          const { data: replyMsg } = await supabase
            .from('messages')
            .select('id, content, sender_id, message_type, file_name')
            .eq('id', msg.reply_to_id)
            .maybeSingle();
          return { ...msg, reply_to: replyMsg as ReplyToMessage | null };
        }
        return msg as Message;
      })
    );
    return messagesWithReplies;
  }, []);

  // Initial fetch - get latest messages
  const fetchInitialMessages = useCallback(async () => {
    if (!conversationId || !userId) return;

    setIsLoading(true);
    try {
      // Check clearance
      const { data: clearance } = await supabase
        .from('conversation_clearances')
        .select('cleared_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();

      const userClearedAt = clearance?.cleared_at || null;
      setClearedAt(userClearedAt);

      // Build query
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (userClearedAt) {
        query = query.gt('created_at', userClearedAt);
      }

      const { data, error } = await query;
      if (error) throw error;

      const sortedData = (data || []).reverse();
      const enriched = await enrichWithReplies(sortedData);
      
      setMessages(enriched);
      setHasMore(sortedData.length === PAGE_SIZE);
      
      if (sortedData.length > 0) {
        oldestMessageRef.current = sortedData[0].created_at;
      }
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
  }, [conversationId, userId, enrichWithReplies, toast]);

  // Load more (older) messages
  const loadMore = useCallback(async () => {
    if (!conversationId || !userId || isLoadingMore || !hasMore || !oldestMessageRef.current) return;

    setIsLoadingMore(true);
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .lt('created_at', oldestMessageRef.current)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (clearedAt) {
        query = query.gt('created_at', clearedAt);
      }

      const { data, error } = await query;
      if (error) throw error;

      const sortedData = (data || []).reverse();
      const enriched = await enrichWithReplies(sortedData);
      
      setMessages(prev => [...enriched, ...prev]);
      setHasMore(sortedData.length === PAGE_SIZE);
      
      if (sortedData.length > 0) {
        oldestMessageRef.current = sortedData[0].created_at;
      }
    } catch (error: any) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, userId, isLoadingMore, hasMore, clearedAt, enrichWithReplies]);

  // Initial fetch when conversation changes
  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    oldestMessageRef.current = null;
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-paginated:${conversationId}`)
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
          
          // Enrich with reply if exists
          if (newMessage.reply_to_id) {
            const { data: replyMsg } = await supabase
              .from('messages')
              .select('id, content, sender_id, message_type, file_name')
              .eq('id', newMessage.reply_to_id)
              .maybeSingle();
            newMessage.reply_to = replyMsg as ReplyToMessage | null;
          }
          
          setMessages(prev => [...prev, newMessage]);
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
          setMessages(prev =>
            prev.map(msg =>
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

  // Send message
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

  // Send file
  const sendFile = async (file: File) => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      const isImage = file.type.startsWith('image/');
      const messageType = isImage ? 'image' : 'file';

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

  // Clear conversation
  const clearConversation = async () => {
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

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    sendMessage,
    sendFile,
    clearConversation,
    refetch: fetchInitialMessages,
  };
};
