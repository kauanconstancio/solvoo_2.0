import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Loader2,
  Search,
  Inbox,
  ArrowRight,
  Trash2,
  MoreVertical,
  MessagesSquare,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useConversations } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Chat = () => {
  const navigate = useNavigate();
  const { conversations, isLoading, deleteConversation } = useConversations();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: false,
      locale: ptBR,
    });
  };

  const truncateMessage = (message: string | undefined, maxLength: number = 50) => {
    if (!message) return "Nenhuma mensagem ainda";
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + "...";
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    setIsDeleting(true);
    await deleteConversation(conversationToDelete);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.other_user?.full_name?.toLowerCase().includes(searchLower) ||
      conv.service?.title?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">Carregando conversas...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container px-4 md:px-6 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessagesSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Mensagens</h1>
                  <p className="text-muted-foreground text-sm">
                    {conversations.length} {conversations.length === 1 ? "conversa" : "conversas"}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            {conversations.length > 0 && (
              <div className="mb-4 md:mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou serviço..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 bg-card border-border/50 rounded-xl text-base"
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {conversations.length === 0 ? (
              <Card className="border-dashed border-2 bg-card/50">
                <CardContent className="py-16 md:py-20 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Inbox className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Sua caixa de entrada está vazia</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    Encontre um serviço e solicite um orçamento para iniciar uma conversa com o profissional.
                  </p>
                  <Button size="lg" onClick={() => navigate("/categorias")} className="rounded-xl">
                    Explorar Serviços
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ) : filteredConversations.length === 0 ? (
              <Card className="bg-card/50">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-muted-foreground">Tente buscar por outro nome ou serviço.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="cursor-pointer hover:shadow-soft hover:border-primary/20 transition-all duration-300 group"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0 ring-2 ring-border/50">
                          <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm md:text-base">
                            {getInitials(conversation.other_user?.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <h3 className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
                              {conversation.other_user?.full_name || "Usuário"}
                            </h3>
                            <span className="text-[11px] md:text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                              {formatDate(conversation.last_message_at)}
                            </span>
                          </div>

                          {conversation.service && (
                            <Badge variant="secondary" className="mb-1 text-[10px] md:text-xs font-normal h-5 px-2">
                              {conversation.service.title.length > 25
                                ? conversation.service.title.slice(0, 25) + "..."
                                : conversation.service.title}
                            </Badge>
                          )}

                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            {conversation.last_message?.sender_id === currentUserId && (
                              <span className="text-foreground/70">Você: </span>
                            )}
                            {truncateMessage(conversation.last_message?.content)}
                          </p>
                        </div>

                        {/* Actions - Desktop */}
                        <div className="hidden md:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => handleDeleteClick(e, conversation.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir conversa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Actions - Mobile */}
                        <div className="md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => handleDeleteClick(e, conversation.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

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
              onClick={handleConfirmDelete}
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

export default Chat;