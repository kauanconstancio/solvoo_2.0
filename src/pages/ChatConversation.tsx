import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Loader2,
  MoreVertical,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMessages, useConversations } from "@/hooks/useChat";
import { useMarkMessagesAsRead } from "@/hooks/useUnreadMessages";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ServiceInfo {
  id: string;
  title: string;
  images: string[] | null;
  price: string;
}

const ChatConversation = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage } = useMessages(conversationId);
  const { deleteConversation } = useConversations();
  const { markAsRead } = useMarkMessagesAsRead();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [service, setService] = useState<ServiceInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId) return;

      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (conv) {
        const { data: { user } } = await supabase.auth.getUser();
        const otherUserId = conv.client_id === user?.id ? conv.professional_id : conv.client_id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .eq("user_id", otherUserId)
          .maybeSingle();

        setOtherUser(profile);

        if (conv.service_id) {
          const { data: serviceData } = await supabase
            .from("services")
            .select("id, title, images, price")
            .eq("id", conv.service_id)
            .maybeSingle();
          setService(serviceData);
        }
      }
    };

    fetchConversation();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (conversationId && messages.length > 0) {
      markAsRead(conversationId);
    }
  }, [messages, conversationId, markAsRead]);

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    setIsDeleting(true);
    const success = await deleteConversation(conversationId);
    setIsDeleting(false);
    if (success) {
      navigate("/chat");
    }
    setDeleteDialogOpen(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    await sendMessage(newMessage.trim());
    setNewMessage("");
    setIsSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const shouldShowDateDivider = (currentIndex: number) => {
    if (currentIndex === 0) return true;
    const currentDate = new Date(messages[currentIndex].created_at);
    const prevDate = new Date(messages[currentIndex - 1].created_at);
    return !isSameDay(currentDate, prevDate);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm h-16" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">Carregando mensagens...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Chat Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm">
        <div className="flex h-16 items-center gap-3 px-3 md:px-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat")}
            className="flex-shrink-0 h-10 w-10 rounded-xl hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 md:h-11 md:w-11 flex-shrink-0 ring-2 ring-border/50">
              <AvatarImage src={otherUser?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(otherUser?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm md:text-base truncate">
                {otherUser?.full_name || "Usuário"}
              </h1>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-10 w-10 rounded-xl hover:bg-muted"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Inicie a conversa</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Envie uma mensagem para começar a negociar com o profissional.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const showDateDivider = shouldShowDateDivider(index);

              return (
                <div key={message.id}>
                  {/* Date Divider */}
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4 md:my-6">
                      <div className="bg-background border px-4 py-1.5 rounded-full text-xs text-muted-foreground font-medium shadow-sm">
                        {formatDateDivider(message.created_at)}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div
                    className={cn(
                      "flex gap-2 animate-fade-in",
                      isOwn ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-1 ring-1 ring-border/50">
                        <AvatarImage src={otherUser?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(otherUser?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border/50 rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] mt-1 text-right",
                          isOwn
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 border-t bg-card/95 backdrop-blur-sm p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2 md:gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="min-h-[48px] max-h-32 resize-none bg-muted/50 border-border/50 rounded-xl pr-4 text-sm md:text-base focus-visible:ring-primary/50"
                disabled={isSending}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="h-12 w-12 flex-shrink-0 rounded-xl shadow-sm"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 hidden md:block">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </footer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens desta conversa serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatConversation;