import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2, Search, Inbox, ArrowRight, Trash2, MoreVertical } from "lucide-react";
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

  const truncateMessage = (message: string | undefined, maxLength: number = 45) => {
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gradient-hero">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando conversas...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <Header />

      <main className="flex-1 py-6 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Mensagens</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {conversations.length} {conversations.length === 1 ? "conversa" : "conversas"}
                </p>
              </div>
              
              {conversations.length > 0 && (
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
              )}
            </div>

            {/* Empty State */}
            {conversations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Inbox className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Sua caixa de entrada está vazia
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    Encontre um serviço e solicite um orçamento para iniciar uma conversa com o profissional.
                  </p>
                  <Button onClick={() => navigate("/categorias")}>
                    Explorar Serviços
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ) : filteredConversations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    Tente buscar por outro nome ou serviço.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="cursor-pointer hover:shadow-soft hover:border-primary/20 transition-all duration-300 group overflow-hidden"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Service Image Thumbnail */}
                        {conversation.service?.images?.[0] && (
                          <div className="hidden sm:block w-24 h-24 flex-shrink-0 bg-muted">
                            <img
                              src={conversation.service.images[0]}
                              alt={conversation.service.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 p-4 flex items-center gap-4">
                          {/* Avatar */}
                          <div className="relative">
                            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-background shadow-sm">
                              <AvatarImage
                                src={conversation.other_user?.avatar_url || undefined}
                              />
                              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                                {getInitials(conversation.other_user?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            {/* Online indicator could go here */}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                {conversation.other_user?.full_name || "Usuário"}
                              </h3>
                              <span className="text-xs text-muted-foreground flex-shrink-0 bg-muted px-2 py-0.5 rounded-full">
                                {formatDate(conversation.last_message_at)}
                              </span>
                            </div>
                            
                            {conversation.service && (
                              <Badge variant="secondary" className="mb-1.5 text-xs font-normal">
                                {conversation.service.title.length > 30 
                                  ? conversation.service.title.slice(0, 30) + "..." 
                                  : conversation.service.title}
                              </Badge>
                            )}
                            
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.last_message?.sender_id === currentUserId && (
                                <span className="text-foreground font-medium">Você: </span>
                              )}
                              {truncateMessage(conversation.last_message?.content)}
                            </p>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => handleDeleteClick(e, conversation.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir conversa
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens desta conversa serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
