import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingUser {
  user_id: string;
  full_name: string | null;
}

export const useTypingIndicator = (conversationId: string | undefined) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

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
        const typingNow: TypingUser[] = [];
        
        Object.entries(state).forEach(([userId, presences]) => {
          if (userId !== currentUserId) {
            const presence = presences[0] as { typing?: boolean; full_name?: string };
            if (presence?.typing) {
              typingNow.push({
                user_id: userId,
                full_name: presence.full_name || null,
              });
            }
          }
        });
        
        setTypingUsers(typingNow);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, currentUserId]);

  const setTyping = useCallback(async (isTyping: boolean, fullName?: string) => {
    if (!channelRef.current) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await channelRef.current.track({ typing: isTyping, full_name: fullName });

    // Auto-stop typing after 3 seconds of inactivity
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({ typing: false, full_name: fullName });
        }
      }, 3000);
    }
  }, []);

  return { typingUsers, setTyping, isOtherUserTyping: typingUsers.length > 0 };
};
