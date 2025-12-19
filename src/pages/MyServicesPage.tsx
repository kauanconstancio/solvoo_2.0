import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUserQuotes, UserQuote } from '@/hooks/useUserQuotes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  Loader2,
  AlertCircle,
  Package,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QuoteCard = ({ quote, userId }: { quote: UserQuote; userId: string | null }) => {
  const isProfessional = quote.professional_id === userId;
  const otherPerson = isProfessional ? quote.client : quote.professional;
  const roleLabel = isProfessional ? 'Cliente' : 'Profissional';
  
  const getStatusBadge = () => {
    if (quote.client_confirmed) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Concluído</Badge>;
    }
    if (quote.completed_at && !quote.client_confirmed) {
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Aguardando Confirmação</Badge>;
    }
    if (quote.status === 'accepted') {
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Em Andamento</Badge>;
    }
    if (quote.status === 'pending') {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
    }
    if (quote.status === 'cancelled') {
      return <Badge className="bg-muted text-muted-foreground">Cancelado</Badge>;
    }
    if (quote.status === 'rejected') {
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Recusado</Badge>;
    }
    if (quote.status === 'expired') {
      return <Badge className="bg-muted text-muted-foreground">Expirado</Badge>;
    }
    return null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Service Image or Placeholder */}
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {quote.service?.images?.[0] ? (
              <img 
                src={quote.service.images[0]} 
                alt={quote.service.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">
                  {quote.title}
                </h3>
                {quote.service && (
                  <p className="text-sm text-muted-foreground truncate">
                    {quote.service.title}
                  </p>
                )}
              </div>
              {getStatusBadge()}
            </div>

            {/* Other Person */}
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="w-6 h-6">
                <AvatarImage src={otherPerson?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {otherPerson?.full_name?.charAt(0) || <User className="w-3 h-3" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {roleLabel}: <span className="text-foreground">{otherPerson?.full_name || 'Usuário'}</span>
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-primary">
                  {formatPrice(quote.price)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(quote.updated_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/chat/${quote.conversation_id}`}>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Ver Conversa
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
  </div>
);

const QuotesList = ({ 
  quotes, 
  userId, 
  emptyState 
}: { 
  quotes: UserQuote[]; 
  userId: string | null;
  emptyState: { icon: React.ElementType; title: string; description: string };
}) => {
  if (quotes.length === 0) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div className="space-y-3">
      {quotes.map(quote => (
        <QuoteCard key={quote.id} quote={quote} userId={userId} />
      ))}
    </div>
  );
};

const MyServicesPage = () => {
  const { 
    inProgress, 
    awaitingConfirmation, 
    completed, 
    pending, 
    cancelled, 
    isLoading, 
    userId 
  } = useUserQuotes();
  const [activeTab, setActiveTab] = useState('in-progress');

  const tabs = [
    { 
      value: 'in-progress', 
      label: 'Em Andamento', 
      count: inProgress.length,
      icon: Clock,
      quotes: inProgress,
      emptyState: {
        icon: Clock,
        title: 'Nenhum serviço em andamento',
        description: 'Quando você tiver orçamentos aceitos, eles aparecerão aqui.'
      }
    },
    { 
      value: 'awaiting', 
      label: 'Aguardando Confirmação', 
      count: awaitingConfirmation.length,
      icon: AlertCircle,
      quotes: awaitingConfirmation,
      emptyState: {
        icon: AlertCircle,
        title: 'Nenhum serviço aguardando',
        description: 'Serviços finalizados aguardando confirmação do cliente aparecerão aqui.'
      }
    },
    { 
      value: 'completed', 
      label: 'Concluídos', 
      count: completed.length,
      icon: CheckCircle2,
      quotes: completed,
      emptyState: {
        icon: CheckCircle2,
        title: 'Nenhum serviço concluído',
        description: 'Seus serviços finalizados e confirmados aparecerão aqui.'
      }
    },
    { 
      value: 'pending', 
      label: 'Pendentes', 
      count: pending.length,
      icon: Loader2,
      quotes: pending,
      emptyState: {
        icon: Loader2,
        title: 'Nenhum orçamento pendente',
        description: 'Orçamentos aguardando resposta aparecerão aqui.'
      }
    },
    { 
      value: 'cancelled', 
      label: 'Cancelados', 
      count: cancelled.length,
      icon: XCircle,
      quotes: cancelled,
      emptyState: {
        icon: XCircle,
        title: 'Nenhum serviço cancelado',
        description: 'Orçamentos cancelados, recusados ou expirados aparecerão aqui.'
      }
    },
  ];

  return (
    <>
      <Helmet>
        <title>Meus Serviços | Solvoo</title>
        <meta name="description" content="Acompanhe seus serviços em andamento, concluídos e pendentes." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Meus Serviços</h1>
            <p className="text-muted-foreground">
              Acompanhe todos os seus orçamentos e serviços
            </p>
          </div>

          {/* Stats Cards */}
          {!isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{inProgress.length}</p>
                  <p className="text-xs text-muted-foreground">Em Andamento</p>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{awaitingConfirmation.length}</p>
                  <p className="text-xs text-muted-foreground">Aguardando</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{completed.length}</p>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="p-4 text-center">
                  <Loader2 className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{pending.length}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6 h-auto p-1 bg-muted/50">
              {tabs.map(tab => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-background"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="w-20 h-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              tabs.map(tab => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  <QuotesList 
                    quotes={tab.quotes} 
                    userId={userId} 
                    emptyState={tab.emptyState}
                  />
                </TabsContent>
              ))
            )}
          </Tabs>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default MyServicesPage;
