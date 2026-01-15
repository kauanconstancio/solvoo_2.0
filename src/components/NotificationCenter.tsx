import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Calendar, FileText, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
    return 'text-red-500 bg-red-500/10';
  }
  if (type.includes('confirmed') || type.includes('accepted') || type.includes('completed')) {
    return 'text-green-500 bg-green-500/10';
  }
  if (type.includes('reminder')) {
    return 'text-amber-500 bg-amber-500/10';
  }
  return 'text-primary bg-primary/10';
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  isMobile?: boolean;
}

const NotificationItem = ({ notification, onRead, onDelete, onClick, isMobile }: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const colorClasses = getNotificationColor(notification.type);

  return (
    <div
      className={cn(
        "relative group transition-all duration-200",
        isMobile ? "p-4" : "p-3",
        !notification.read && "bg-primary/5",
        "hover:bg-muted/50 active:bg-muted/70"
      )}
      onClick={() => onClick(notification)}
    >
      <div className="flex gap-3">
        <div className={cn(
          "flex-shrink-0 p-2 rounded-xl",
          colorClasses
        )}>
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
              <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-0.5 ring-2 ring-primary/20" />
            )}
          </div>
          {notification.message && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-2">
            {timeAgo}
          </p>
        </div>
      </div>
      
      {/* Actions - always visible on mobile, hover on desktop */}
      <div className={cn(
        "absolute right-3 top-3 flex gap-1 transition-opacity",
        isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30"
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  isMobile?: boolean;
}

const NotificationList = ({ notifications, isLoading, onRead, onDelete, onClick, isMobile }: NotificationListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground px-6">
        <div className="p-4 bg-muted/50 rounded-full mb-4">
          <Bell className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-sm font-medium">Nenhuma notificação</p>
        <p className="text-xs text-center mt-1 opacity-70">
          Você receberá notificações sobre orçamentos e agendamentos aqui
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={onRead}
          onDelete={onDelete}
          onClick={onClick}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
};

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
    if (!notification.read) {
      markAsRead(notification.id);
    }

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

  const TriggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center animate-in zoom-in-50 duration-200"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  const HeaderActions = (
    <div className="flex gap-2">
      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-full border-primary/20 hover:bg-primary/10 hover:border-primary/30"
          onClick={markAllAsRead}
        >
          <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
          Marcar todas
        </Button>
      )}
      {notifications.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-full border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/30"
          onClick={clearAllNotifications}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Limpar
        </Button>
      )}
    </div>
  );

  // Mobile: Use Sheet for full-screen experience
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {TriggerButton}
        </SheetTrigger>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-3xl px-0 pb-0"
        >
          {/* Header */}
          <div className="px-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-primary/20">
                <Bell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <SheetTitle className="text-lg">Notificações</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
                </p>
              </div>
            </div>
            {HeaderActions}
          </div>

          {/* Content */}
          <ScrollArea className="h-[calc(85vh-120px)]">
            <NotificationList
              notifications={notifications}
              isLoading={isLoading}
              onRead={markAsRead}
              onDelete={deleteNotification}
              onClick={handleNotificationClick}
              isMobile={true}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {TriggerButton}
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 rounded-2xl border-border/50 shadow-xl" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl">
                <Bell className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Notificações</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
                </p>
              </div>
            </div>
          </div>
          {HeaderActions}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[360px]">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            onRead={markAsRead}
            onDelete={deleteNotification}
            onClick={handleNotificationClick}
            isMobile={false}
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
