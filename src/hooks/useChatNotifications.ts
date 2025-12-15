import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

export const useChatNotifications = () => {
  const location = useLocation();
  const permissionRef = useRef<NotificationPermission>('default');
  const currentUserIdRef = useRef<string | null>(null);

  // Check if we're on a chat page
  const isOnChatPage = location.pathname.startsWith('/chat');

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      permissionRef.current = permission;
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show notification
  const showNotification = useCallback((title: string, body: string, conversationId?: string) => {
    if (permissionRef.current !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/solvoo_favicon.png',
      badge: '/solvoo_favicon.png',
      tag: conversationId || 'chat-notification',
    });

    notification.onclick = () => {
      window.focus();
      if (conversationId) {
        window.location.href = `/chat/${conversationId}`;
      } else {
        window.location.href = '/chat';
      }
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }, []);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserIdRef.current = user?.id || null;
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      currentUserIdRef.current = session?.user?.id || null;
    });

    return () => subscription.unsubscribe();
  }, []);

  // Request permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Subscribe to new messages
  useEffect(() => {
    if (!currentUserIdRef.current) return;

    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            message_type?: string;
          };

          // Don't notify for own messages
          if (newMessage.sender_id === currentUserIdRef.current) return;

          // Don't notify if user is on the specific chat page
          if (location.pathname === `/chat/${newMessage.conversation_id}`) return;

          // Check if user is part of this conversation
          const { data: conversation } = await supabase
            .from('conversations')
            .select('client_id, professional_id')
            .eq('id', newMessage.conversation_id)
            .maybeSingle();

          if (!conversation) return;

          const isParticipant = 
            conversation.client_id === currentUserIdRef.current ||
            conversation.professional_id === currentUserIdRef.current;

          if (!isParticipant) return;

          // Get sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', newMessage.sender_id)
            .maybeSingle();

          const senderName = senderProfile?.full_name || 'Alguém';
          
          // Determine message preview
          let messagePreview = newMessage.content;
          if (newMessage.message_type === 'image') {
            messagePreview = '📷 Enviou uma imagem';
          } else if (newMessage.message_type === 'file') {
            messagePreview = '📎 Enviou um arquivo';
          } else if (messagePreview.length > 50) {
            messagePreview = messagePreview.substring(0, 50) + '...';
          }

          showNotification(
            `Nova mensagem de ${senderName}`,
            messagePreview,
            newMessage.conversation_id
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location.pathname, showNotification]);

  return { requestPermission, isNotificationsEnabled: permissionRef.current === 'granted' };
};
