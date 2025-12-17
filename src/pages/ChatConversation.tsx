import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  Flag,
  Check,
  CheckCheck,
} from "lucide-react";
import ReportUserDialog from "@/components/ReportUserDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  useMessages,
  useConversations,
  useCreateConversation,
  Message,
  ReplyToMessage,
} from "@/hooks/useChat";
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
      <span
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  </div>
);

const ChatConversation = () => {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if this is a new conversation
  const isNewConversation = conversationId === "new";
  const professionalId = searchParams.get("professionalId");
  const serviceId = searchParams.get("serviceId");

  const {
    messages,
    isLoading: isLoadingMessages,
    sendMessage,
    sendFile,
  } = useMessages(isNewConversation ? undefined : conversationId);
  const { deleteConversation } = useConversations();
  const { createOrGetConversation } = useCreateConversation();
  const { markAsRead } = useMarkMessagesAsRead();
  const { typingUsers, setTyping, isOtherUserTyping } = useTypingIndicator(
    isNewConversation ? undefined : conversationId
  );
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
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    previewUrl: string;
    isImage: boolean;
  } | null>(null);
  const [pendingCaption, setPendingCaption] = useState("");
  const [isLoadingNewConversation, setIsLoadingNewConversation] =
    useState(isNewConversation);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      // Handle new conversation
      if (isNewConversation) {
        if (!professionalId) {
          toast({
            title: "Erro",
            description: "Informações da conversa não encontradas.",
            variant: "destructive",
          });
          navigate("/chat");
          return;
        }

        // Fetch professional profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .eq("user_id", professionalId)
          .maybeSingle();

        setOtherUser(profile);

        // Fetch service if provided
        if (serviceId) {
          const { data: serviceData } = await supabase
            .from("services")
            .select("id, title, images, price")
            .eq("id", serviceId)
            .maybeSingle();
          setService(serviceData);
        }

        setIsLoadingNewConversation(false);
        return;
      }

      // Handle existing conversation
      if (!conversationId) return;

      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (conv) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const otherUserId =
          conv.client_id === user?.id ? conv.professional_id : conv.client_id;

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
  }, [
    conversationId,
    isNewConversation,
    professionalId,
    serviceId,
    navigate,
    toast,
  ]);

  // Handle pending message after conversation creation
  useEffect(() => {
    const sendPendingMessage = async () => {
      const pendingMessageStr = sessionStorage.getItem("pendingMessage");
      if (pendingMessageStr && conversationId && !isNewConversation) {
        try {
          const pendingMessage = JSON.parse(pendingMessageStr);
          sessionStorage.removeItem("pendingMessage");

          await sendMessage(
            pendingMessage.content,
            "text",
            undefined,
            undefined,
            pendingMessage.replyToId
          );
          setNewMessage("");
          setReplyingTo(null);
        } catch (error) {
          console.error("Error sending pending message:", error);
        }
      }
    };

    sendPendingMessage();
  }, [conversationId, isNewConversation, sendMessage]);

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

    // If this is a new conversation, create it first
    if (isNewConversation && professionalId) {
      const newConvId = await createOrGetConversation(
        professionalId,
        serviceId || undefined
      );
      if (newConvId) {
        // Navigate to the new conversation with the message
        navigate(`/chat/${newConvId}`, { replace: true });
        // The message will be sent after navigation via useEffect
        // Store message in sessionStorage temporarily
        sessionStorage.setItem(
          "pendingMessage",
          JSON.stringify({
            content: newMessage.trim(),
            replyToId: replyingTo?.id,
          })
        );
      }
      setIsSending(false);
      return;
    }

    await sendMessage(
      newMessage.trim(),
      "text",
      undefined,
      undefined,
      replyingTo?.id
    );
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
    const messageType = message.message_type || "text";
    if (messageType === "image") return "📷 Imagem";
    if (messageType === "file") return `📎 ${message.file_name || "Arquivo"}`;
    return message.content.length > 50
      ? message.content.slice(0, 50) + "..."
      : message.content;
  };

  const getReplyingSenderName = (senderId: string) => {
    if (senderId === currentUserId) return "Você";
    return otherUser?.full_name || "Usuário";
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

    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : "";

    setPendingFile({ file, previewUrl, isImage });
    setPendingCaption("");

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Focus caption input after modal opens
    setTimeout(() => captionInputRef.current?.focus(), 100);
  };

  const handleCancelFilePreview = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
    setPendingCaption("");
  };

  const handleSendFileWithCaption = async () => {
    if (!pendingFile) return;

    setIsUploadingFile(true);

    // Send the file
    await sendFile(pendingFile.file);

    // If there's a caption, send it as a separate text message
    if (pendingCaption.trim()) {
      await sendMessage(pendingCaption.trim(), "text");
    }

    // Cleanup
    if (pendingFile.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
    setPendingCaption("");
    setIsUploadingFile(false);
  };

  const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendFileWithCaption();
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

  const renderReadStatus = (message: (typeof messages)[0], isOwn: boolean) => {
    if (!isOwn) return null;

    return message.read_at ? (
      <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
    ) : (
      <Check className="h-3.5 w-3.5" />
    );
  };

  const renderMessageContent = (
    message: (typeof messages)[0],
    isOwn: boolean
  ) => {
    const messageType = message.message_type || "text";

    if (messageType === "image" && message.file_url) {
      return (
        <div className="space-y-1">
          <img
            src={message.file_url}
            alt={message.file_name || "Imagem"}
            className="max-w-[250px] md:max-w-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setPreviewImage(message.file_url!)}
          />
          <div
            className={cn(
              "flex items-center justify-end gap-1 text-[10px]",
              isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
          >
            <span>{formatMessageTime(message.created_at)}</span>
            {renderReadStatus(message, isOwn)}
          </div>
        </div>
      );
    }

    if (messageType === "file" && message.file_url) {
      return (
        <div className="space-y-1">
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg transition-colors",
              isOwn
                ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <FileIcon className="h-8 w-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.file_name || "Arquivo"}
              </p>
              <p
                className={cn(
                  "text-xs",
                  isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                )}
              >
                Clique para baixar
              </p>
            </div>
            <Download className="h-4 w-4 flex-shrink-0" />
          </a>
          <div
            className={cn(
              "flex items-center justify-end gap-1 text-[10px]",
              isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
          >
            <span>{formatMessageTime(message.created_at)}</span>
            {renderReadStatus(message, isOwn)}
          </div>
        </div>
      );
    }

    // Default text message
    return (
      <>
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 text-[10px] mt-1",
            isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          <span>{formatMessageTime(message.created_at)}</span>
          {renderReadStatus(message, isOwn)}
        </div>
      </>
    );
  };

  const isLoading = isNewConversation
    ? isLoadingNewConversation
    : isLoadingMessages;

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm">
          <div className="flex h-16 items-center gap-3 px-3 md:px-4 max-w-4xl mx-auto">
            <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="h-10 w-10 md:h-11 md:w-11 rounded-full flex-shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
          </div>
        </header>
        <main className="flex-1 overflow-hidden bg-muted/30 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  i % 2 === 0 ? "justify-end" : "justify-start"
                }`}
              >
                {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                <Skeleton
                  className={`h-12 rounded-2xl ${
                    i % 2 === 0 ? "w-48 rounded-br-md" : "w-64 rounded-bl-md"
                  }`}
                />
              </div>
            ))}
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
            className="flex-shrink-0 h-10 w-10 rounded-xl hover:bg-primary transition-smooth"
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
                className="flex-shrink-0 h-10 w-10 rounded-xl hover:bg-primary transition-smooth"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {otherUser && (
                <ReportUserDialog
                  reportedUserId={otherUser.user_id}
                  reportedUserName={otherUser.full_name}
                  trigger={
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 transition-smooth"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Denunciar usuário
                    </DropdownMenuItem>
                  }
                />
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 transition-smooth"
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
                          className="h-8 w-8 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-center bg-muted/50 md:bg-transparent hover:bg-primary hover:text-primary-foreground transition-smooth"
                          onClick={() => handleReply(message)}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                      )}

                      {!isOwn && (
                        <Avatar className="h-8 w-8 flex-shrink-0 mt-1 ring-1 ring-border/50">
                          <AvatarImage
                            src={otherUser?.avatar_url || undefined}
                          />
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
                                {getReplyingSenderName(
                                  message.reply_to.sender_id
                                )}
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
                          className="h-8 w-8 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-center bg-muted/50 md:bg-transparent hover:bg-primary hover:text-primary-foreground transition-smooth"
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
              className="h-12 w-12 flex-shrink-0 rounded-xl hover:bg-primary transition-smooth"
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
                      <span>
                        Respondendo a{" "}
                        {getReplyingSenderName(replyingTo.sender_id)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {getReplyPreviewText(replyingTo)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 hover:bg-primary hover:text-primary-foreground transition-smooth"
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
              className="h-12 w-12 flex-shrink-0 rounded-xl shadow-sm hover:bg-primary hover:text-primary-foreground transition-smooth"
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

      {/* File Preview Modal - WhatsApp style */}
      {pendingFile && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-xl"
              onClick={handleCancelFilePreview}
            >
              <X className="h-6 w-6" />
            </Button>
            <span className="text-white text-sm font-medium">
              {pendingFile.isImage ? "Enviar imagem" : pendingFile.file.name}
            </span>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Preview area */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {pendingFile.isImage ? (
              <img
                src={pendingFile.previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white">
                <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center">
                  <FileIcon className="h-12 w-12" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{pendingFile.file.name}</p>
                  <p className="text-sm text-white/60">
                    {(pendingFile.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Caption input and send */}
          <div className="p-4 border-t border-white/10">
            <div className="max-w-2xl mx-auto flex items-end gap-3">
              <div className="flex-1">
                <Textarea
                  ref={captionInputRef}
                  value={pendingCaption}
                  onChange={(e) => setPendingCaption(e.target.value)}
                  onKeyDown={handleCaptionKeyDown}
                  placeholder="Adicione uma legenda..."
                  className="min-h-[48px] max-h-32 resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus-visible:ring-white/30"
                  rows={1}
                  disabled={isUploadingFile}
                />
              </div>
              <Button
                onClick={handleSendFileWithCaption}
                disabled={isUploadingFile}
                size="icon"
                className="h-12 w-12 flex-shrink-0 rounded-xl bg-primary hover:bg-primary/90 shadow-lg"
              >
                {isUploadingFile ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-white/40 text-center mt-2">
              Pressione Enter para enviar
            </p>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens desta conversa
              serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
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
