import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Loader2,
  MoreVertical,
  Trash2,
  MessageCircle,
  Paperclip,
  Image as ImageIcon,
  X,
  FileIcon,
  Download,
  Reply,
  CornerDownRight,
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
import { useMessages, useConversations, Message, ReplyToMessage } from "@/hooks/useChat";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useMarkMessagesAsRead } from "@/hooks/useUnreadMessages";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ServiceInfo {
  id: string;
  title: string;
  images: string[] | null;
  price: string;
}

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const ChatConversation = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { messages, isLoading, sendMessage, sendFile } = useMessages(conversationId);
  const { deleteConversation } = useConversations();
  const { markAsRead } = useMarkMessagesAsRead();
  const { typingUsers, setTyping, isOtherUserTyping } = useTypingIndicator(conversationId);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [service, setService] = useState<ServiceInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();
        setCurrentUserName(profile?.full_name || null);
      }
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
    setTyping(false, currentUserName || undefined);
    await sendMessage(newMessage.trim(), 'text', undefined, undefined, replyingTo?.id);
    setNewMessage("");
    setReplyingTo(null);
    setIsSending(false);
    textareaRef.current?.focus();
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const getReplyPreviewText = (message: Message | ReplyToMessage) => {
    const messageType = message.message_type || 'text';
    if (messageType === 'image') return '📷 Imagem';
    if (messageType === 'file') return `📎 ${message.file_name || 'Arquivo'}`;
    return message.content.length > 50 ? message.content.slice(0, 50) + '...' : message.content;
  };

  const getReplyingSenderName = (senderId: string) => {
    if (senderId === currentUserId) return 'Você';
    return otherUser?.full_name || 'Usuário';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      setTyping(true, currentUserName || undefined);
    } else {
      setTyping(false, currentUserName || undefined);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingFile(true);
    await sendFile(file);
    setIsUploadingFile(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const renderMessageContent = (message: typeof messages[0], isOwn: boolean) => {
    const messageType = message.message_type || 'text';

    if (messageType === 'image' && message.file_url) {
      return (
        <div className="space-y-1">
          <img
            src={message.file_url}
            alt={message.file_name || "Imagem"}
            className="max-w-[250px] md:max-w-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setPreviewImage(message.file_url!)}
          />
          <p
            className={cn(
              "text-[10px] text-right",
              isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
          >
            {formatMessageTime(message.created_at)}
          </p>
        </div>
      );
    }

    if (messageType === 'file' && message.file_url) {
      return (
        <div className="space-y-1">
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg transition-colors",
              isOwn ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-muted hover:bg-muted/80"
            )}
          >
            <FileIcon className="h-8 w-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.file_name || "Arquivo"}</p>
              <p className={cn(
                "text-xs",
                isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>
                Clique para baixar
              </p>
            </div>
            <Download className="h-4 w-4 flex-shrink-0" />
          </a>
          <p
            className={cn(
              "text-[10px] text-right",
              isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
          >
            {formatMessageTime(message.created_at)}
          </p>
        </div>
      );
    }

    // Default text message
    return (
      <>
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
        <p
          className={cn(
            "text-[10px] mt-1 text-right",
            isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {formatMessageTime(message.created_at)}
        </p>
      </>
    );
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
              {isOtherUserTyping ? (
                <p className="text-xs text-primary font-medium">Digitando...</p>
              ) : (
                <p className="text-xs text-muted-foreground">Online</p>
              )}
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
            <>
              {messages.map((message, index) => {
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
                        "flex gap-2 animate-fade-in group",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {/* Reply button - left side for own messages */}
                      {isOwn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity self-center hover:bg-accent hover:text-accent-foreground"
                          onClick={() => handleReply(message)}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                      )}

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
                        {/* Reply quote */}
                        {message.reply_to && (
                          <div
                            className={cn(
                              "mb-2 p-2 rounded-lg border-l-2 text-xs",
                              isOwn
                                ? "bg-primary-foreground/10 border-primary-foreground/40"
                                : "bg-muted/50 border-primary/40"
                            )}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <CornerDownRight className="h-3 w-3" />
                              <span className="font-medium">
                                {getReplyingSenderName(message.reply_to.sender_id)}
                              </span>
                            </div>
                            <p className="truncate opacity-80">
                              {getReplyPreviewText(message.reply_to)}
                            </p>
                          </div>
                        )}
                        {renderMessageContent(message, isOwn)}
                      </div>

                      {/* Reply button - right side for other's messages */}
                      {!isOwn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity self-center hover:bg-accent hover:text-accent-foreground"
                          onClick={() => handleReply(message)}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {isOtherUserTyping && (
                <div className="flex gap-2 justify-start animate-fade-in">
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1 ring-1 ring-border/50">
                    <AvatarImage src={otherUser?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(otherUser?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md shadow-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 border-t bg-card/95 backdrop-blur-sm p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2 md:gap-3">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile || isSending}
              className="h-12 w-12 flex-shrink-0 rounded-xl hover:bg-muted"
            >
              {isUploadingFile ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Paperclip className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1 relative">
              {/* Reply preview bar */}
              {replyingTo && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Reply className="h-3 w-3" />
                      <span>Respondendo a {getReplyingSenderName(replyingTo.sender_id)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {getReplyPreviewText(replyingTo)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 hover:bg-accent hover:text-accent-foreground"
                    onClick={cancelReply}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="min-h-[48px] max-h-32 resize-none bg-muted/50 border-border/50 rounded-xl pr-4 text-sm md:text-base focus-visible:ring-primary/50"
                disabled={isSending || isUploadingFile}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending || isUploadingFile}
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
