import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, Loader2, MoreVertical, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages } from "@/hooks/useChat";
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

        // Fetch service info
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

  // Scroll to bottom and mark messages as read
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (conversationId && messages.length > 0) {
      markAsRead(conversationId);
    }
  }, [messages, conversationId, markAsRead]);

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
      <div className="min-h-screen flex flex-col bg-muted/30">
        <header className="sticky top-0 z-50 w-full border-b bg-background h-16" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Chat Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
        <div className="flex h-16 items-center gap-3 px-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-background">
              <AvatarImage src={otherUser?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(otherUser?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">
                {otherUser?.full_name || "Usuário"}
              </h1>
              {service && (
                <p className="text-xs text-muted-foreground truncate">
                  {service.title}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {service && (
                <DropdownMenuItem asChild>
                  <Link to={`/servico/${service.id}`} className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver serviço
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Service Banner (if exists) */}
      {service && (
        <Link 
          to={`/servico/${service.id}`}
          className="bg-background border-b px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {service.images?.[0] ? (
              <img
                src={service.images[0]}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{service.title}</p>
            <p className="text-sm text-primary font-semibold">{service.price}</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Link>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <Card className="border-dashed mt-8">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Send className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Inicie a conversa</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Envie uma mensagem para começar a negociar com o profissional.
                </p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const showDateDivider = shouldShowDateDivider(index);

              return (
                <div key={message.id}>
                  {/* Date Divider */}
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-muted px-4 py-1.5 rounded-full text-xs text-muted-foreground font-medium">
                        {formatDateDivider(message.created_at)}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div
                    className={cn(
                      "flex gap-2 group",
                      isOwn ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                        <AvatarImage src={otherUser?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(otherUser?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-background border rounded-bl-sm"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] mt-1.5 text-right",
                          isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
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
      <footer className="sticky bottom-0 border-t bg-background p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-h-[44px] max-h-32 resize-none bg-muted/50 border-0 focus-visible:ring-1"
              disabled={isSending}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="h-11 w-11 flex-shrink-0 rounded-full"
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
    </div>
  );
};

export default ChatConversation;
