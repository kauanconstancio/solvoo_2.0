import { useEffect } from 'react';
import { useChatNotifications } from '@/hooks/useChatNotifications';

// This component initializes chat notifications globally
const ChatNotificationProvider = () => {
  useChatNotifications();
  return null;
};

export default ChatNotificationProvider;
