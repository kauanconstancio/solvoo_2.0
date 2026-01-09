import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Calendar, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'quote_created':
    case 'quote_accepted':
    case 'quote_rejected':
    case 'quote_expired':
      return <FileText className="h-4 w-4" />;
    case 'appointment_created':
    case 'appointment_confirmed':
    case 'appointment_cancelled':
    case 'appointment_completed':
    case 'appointment_reminder':
      return <Calendar className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: string) => {
  if (type.includes('cancelled') || type.includes('rejected') || type.includes('expired')) {
    return 'text-destructive';
  }
  if (type.includes('confirmed') || type.includes('accepted') || type.includes('completed')) {
    return 'text-green-500';
  }
  if (type.includes('reminder')) {
    return 'text-yellow-500';
  }
  return 'text-primary';
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const NotificationItem = ({ notification, onRead, onDelete, onClick }: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        "p-3 hover:bg-muted/50 cursor-pointer transition-colors relative group",
        !notification.read && "bg-primary/5"
      )}
      onClick={() => onClick(notification)}
    >
      <div className="flex gap-3">
        <div className={cn("mt-0.5", getNotificationColor(notification.type))}>
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm leading-tight",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
          {notification.message && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {timeAgo}
          </p>
        </div>
      </div>
      
      {/* Actions on hover */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    const data = notification.data as Record<string, string> | null;
    
    if (data?.conversation_id) {
      navigate(`/chat/${data.conversation_id}`);
    } else if (data?.appointment_id) {
      navigate('/dashboard');
    } else if (data?.quote_id) {
      if (data?.conversation_id) {
        navigate(`/chat/${data.conversation_id}`);
      } else {
        navigate('/dashboard');
      }
    }
    
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary hover:text-primary-foreground transition-smooth"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={clearAllNotifications}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
