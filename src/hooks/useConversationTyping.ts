import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingState {
  [conversationId: string]: {
    user_id: string;
    full_name: string | null;
  } | null;
}

export const useConversationTyping = (conversationIds: string[]) => {
  const [typingStates, setTypingStates] = useState<TypingState>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const channelsRef = useRef<Map<string, ReturnType<typeof supabase.channel>>>(new Map());

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!currentUserId || conversationIds.length === 0) return;

    // Subscribe to each conversation's typing channel
    conversationIds.forEach((conversationId) => {
      if (channelsRef.current.has(conversationId)) return;

      const channel = supabase.channel(`typing:${conversationId}`, {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          let typingUser: { user_id: string; full_name: string | null } | null = null;

          Object.entries(state).forEach(([userId, presences]) => {
            if (userId !== currentUserId) {
              const presence = presences[0] as { typing?: boolean; full_name?: string };
              if (presence?.typing) {
                typingUser = {
                  user_id: userId,
                  full_name: presence.full_name || null,
                };
              }
            }
          });

          setTypingStates(prev => ({
            ...prev,
            [conversationId]: typingUser,
          }));
        })
        .subscribe();

      channelsRef.current.set(conversationId, channel);
    });

    // Cleanup channels for removed conversation IDs
    const currentChannels = Array.from(channelsRef.current.keys());
    currentChannels.forEach((channelId) => {
      if (!conversationIds.includes(channelId)) {
        const channel = channelsRef.current.get(channelId);
        if (channel) {
          supabase.removeChannel(channel);
          channelsRef.current.delete(channelId);
        }
      }
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [conversationIds.join(','), currentUserId]);

  const isTyping = (conversationId: string) => !!typingStates[conversationId];
  const getTypingUser = (conversationId: string) => typingStates[conversationId];

  return { isTyping, getTypingUser, typingStates };
};
