import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Conversation, Message } from './useChat';

interface ConversationsCache {
  active: Conversation[];
  archived: Conversation[];
  activeLoaded: boolean;
  archivedLoaded: boolean;
}

export const useConversationsWithCache = () => {
  const [cache, setCache] = useState<ConversationsCache>({
    active: [],
    archived: [],
    activeLoaded: false,
    archivedLoaded: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const isFetchingRef = useRef(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const fetchAllConversations = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        isFetchingRef.current = false;
        return;
      }

      // Fetch archived conversation IDs and all conversations in parallel
      const [archivedResult, conversationsResult] = await Promise.all([
        supabase
          .from('conversation_archives')
          .select('conversation_id')
          .eq('user_id', user.id),
        supabase
          .from('conversations')
          .select('*')
          .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false })
      ]);

      if (conversationsResult.error) throw conversationsResult.error;

      const archivedIds = new Set((archivedResult.data || []).map(a => a.conversation_id));
      const allConversations = conversationsResult.data || [];

      // Split into active and archived
      const activeConvs = allConversations.filter(c => !archivedIds.has(c.id));
      const archivedConvs = allConversations.filter(c => archivedIds.has(c.id));

      // Enrich all conversations in parallel
      const enrichConversation = async (conv: any) => {
        const otherUserId = conv.client_id === user.id ? conv.professional_id : conv.client_id;
        
        const [profileResult, serviceResult, messagesResult, unreadResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', otherUserId)
            .maybeSingle(),
          conv.service_id 
            ? supabase
                .from('services')
                .select('id, title, images')
                .eq('id', conv.service_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null)
        ]);

        return {
          ...conv,
          other_user: profileResult.data || undefined,
          service: serviceResult.data,
          last_message: messagesResult.data?.[0] || undefined,
          unread_count: unreadResult.count || 0,
        };
      };

      // Enrich both lists in parallel
      const [enrichedActive, enrichedArchived] = await Promise.all([
        Promise.all(activeConvs.map(enrichConversation)),
        Promise.all(archivedConvs.map(enrichConversation))
      ]);

      setCache({
        active: enrichedActive,
        archived: enrichedArchived,
        activeLoaded: true,
        archivedLoaded: true,
      });
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as conversas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [toast]);

  useEffect(() => {
    fetchAllConversations();
  }, [fetchAllConversations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('conversations-cache-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          setCache(prev => {
            // Check in active conversations
            const activeIndex = prev.active.findIndex(c => c.id === newMessage.conversation_id);
            if (activeIndex !== -1) {
              const updated = [...prev.active];
              const conv = updated[activeIndex];
              const isFromOther = newMessage.sender_id !== userId;
              updated[activeIndex] = {
                ...conv,
                last_message: newMessage,
                last_message_at: newMessage.created_at,
                unread_count: isFromOther ? (conv.unread_count || 0) + 1 : conv.unread_count,
              };
              return { ...prev, active: updated };
            }
            
            // Check in archived conversations
            const archivedIndex = prev.archived.findIndex(c => c.id === newMessage.conversation_id);
            if (archivedIndex !== -1) {
              const updated = [...prev.archived];
              const conv = updated[archivedIndex];
              const isFromOther = newMessage.sender_id !== userId;
              updated[archivedIndex] = {
                ...conv,
                last_message: newMessage,
                last_message_at: newMessage.created_at,
                unread_count: isFromOther ? (conv.unread_count || 0) + 1 : conv.unread_count,
              };
              return { ...prev, archived: updated };
            }
            
            // New conversation - refetch
            fetchAllConversations();
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchAllConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_archives',
        },
        () => {
          fetchAllConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAllConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await supabase.from('messages').delete().eq('conversation_id', conversationId);
      const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
      if (error) throw error;

      setCache(prev => ({
        ...prev,
        active: prev.active.filter(c => c.id !== conversationId),
        archived: prev.archived.filter(c => c.id !== conversationId),
      }));

      toast({ title: 'Sucesso', description: 'Conversa excluída com sucesso.' });
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir a conversa.', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('conversation_archives').insert({
        user_id: user.id,
        conversation_id: conversationId,
      });
      if (error) throw error;

      setCache(prev => {
        const conv = prev.active.find(c => c.id === conversationId);
        if (!conv) return prev;
        return {
          ...prev,
          active: prev.active.filter(c => c.id !== conversationId),
          archived: [conv, ...prev.archived],
        };
      });

      toast({ title: 'Conversa arquivada', description: 'A conversa foi movida para o arquivo.' });
      return true;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast({ title: 'Erro', description: 'Não foi possível arquivar a conversa.', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  const unarchiveConversation = useCallback(async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('conversation_archives')
        .delete()
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId);
      if (error) throw error;

      setCache(prev => {
        const conv = prev.archived.find(c => c.id === conversationId);
        if (!conv) return prev;
        return {
          ...prev,
          archived: prev.archived.filter(c => c.id !== conversationId),
          active: [conv, ...prev.active],
        };
      });

      toast({ title: 'Conversa desarquivada', description: 'A conversa foi restaurada.' });
      return true;
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      toast({ title: 'Erro', description: 'Não foi possível desarquivar a conversa.', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  // Calculate unread counts
  const archivedUnreadCount = cache.archived.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return {
    activeConversations: cache.active,
    archivedConversations: cache.archived,
    activeCount: cache.active.length,
    archivedCount: cache.archived.length,
    archivedUnreadCount,
    isLoading,
    refetch: fetchAllConversations,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
  };
};
