import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversations } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Chat = () => {
  const navigate = useNavigate();
  const { conversations, isLoading } = useConversations();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
      addSuffix: true,
      locale: ptBR,
    });
  };

  const truncateMessage = (message: string | undefined, maxLength: number = 50) => {
    if (!message) return "Nenhuma mensagem ainda";
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Mensagens</h1>

            {conversations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma conversa ainda
                  </h3>
                  <p className="text-muted-foreground">
                    Quando você entrar em contato com um profissional, suas
                    conversas aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="cursor-pointer hover:bg-muted/50 transition-smooth"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage
                            src={conversation.other_user?.avatar_url || undefined}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(conversation.other_user?.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {conversation.other_user?.full_name || "Usuário"}
                            </h3>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDate(conversation.last_message_at)}
                            </span>
                          </div>
                          
                          {conversation.service && (
                            <p className="text-xs text-primary mb-1 truncate">
                              {conversation.service.title}
                            </p>
                          )}
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message?.sender_id === currentUserId && (
                              <span className="text-muted-foreground">Você: </span>
                            )}
                            {truncateMessage(conversation.last_message?.content)}
                          </p>
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
    </div>
  );
};

export default Chat;
