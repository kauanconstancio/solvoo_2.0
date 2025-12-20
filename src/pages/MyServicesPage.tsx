import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppointmentsCalendar from '@/components/AppointmentsCalendar';
import { useUserQuotes, UserQuote } from '@/hooks/useUserQuotes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle,
  User,
  ChevronRight,
  Briefcase,
  Calendar,
  MapPin,
  CalendarDays,
  ListFilter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QuoteCard = ({ quote, userId }: { quote: UserQuote; userId: string | null }) => {
  const isProfessional = quote.professional_id === userId;
  const otherPerson = isProfessional ? quote.client : quote.professional;
  const roleLabel = isProfessional ? 'Cliente' : 'Profissional';
  
  const getStatusConfig = () => {
    if (quote.client_confirmed) {
      return { label: 'Concluído', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' };
    }
    if (quote.completed_at && !quote.client_confirmed) {
      return { label: 'Aguardando', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    if (quote.status === 'accepted') {
      return { label: 'Em Andamento', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    }
    if (quote.status === 'pending') {
      return { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' };
    }
    if (quote.status === 'cancelled') {
      return { label: 'Cancelado', className: 'bg-muted text-muted-foreground' };
    }
    if (quote.status === 'rejected') {
      return { label: 'Recusado', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    }
    if (quote.status === 'expired') {
      return { label: 'Expirado', className: 'bg-muted text-muted-foreground' };
    }
    return { label: '', className: '' };
  };

  const statusConfig = getStatusConfig();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Link to={`/chat/${quote.conversation_id}`} className="block">
      <Card className="group hover:shadow-md transition-all border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          {/* Top Row: Time, Status & Price */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {quote.appointment && (
                <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {quote.appointment.scheduled_time}
                </div>
              )}
              <Badge className={`${statusConfig.className} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
                {statusConfig.label}
              </Badge>
            </div>
            <span className="font-bold text-sm sm:text-base text-primary">
              {formatPrice(quote.price)}
            </span>
          </div>

          {/* Title & Service */}
          <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-1 mb-1">
            {quote.title}
          </h3>
          {quote.service && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2">
              {quote.service.title}
            </p>
          )}

          {/* Appointment Date */}
          {quote.appointment && (
            <div className="flex items-center gap-1.5 mb-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-md px-2 py-1 w-fit">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>
                {format(new Date(quote.appointment.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
              </span>
              {quote.appointment.location && (
                <>
                  <MapPin className="w-3 h-3 flex-shrink-0 ml-1" />
                  <span className="truncate hidden sm:inline">{quote.appointment.location}</span>
                </>
              )}
            </div>
          )}

          {/* Person & Arrow */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5 sm:w-6 sm:h-6 border border-border">
                <AvatarImage src={otherPerson?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] sm:text-xs bg-muted">
                  {otherPerson?.full_name?.charAt(0) || <User className="w-2.5 h-2.5" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                <span className="hidden sm:inline">{roleLabel}: </span>
                <span className="text-foreground font-medium">{otherPerson?.full_name || 'Usuário'}</span>
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                · {formatDistanceToNow(new Date(quote.updated_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
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
  <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground/70" />
    </div>
    <h3 className="font-semibold text-foreground mb-1.5 text-sm sm:text-base">{title}</h3>
    <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">{description}</p>
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
    <div className="space-y-2 sm:space-y-3">
      {quotes.map(quote => (
        <QuoteCard key={quote.id} quote={quote} userId={userId} />
      ))}
    </div>
  );
};

const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  colorClass 
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string; 
  colorClass: string; 
}) => (
  <div className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border ${colorClass}`}>
    <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
    <span className="text-xl sm:text-2xl font-bold text-foreground">{value}</span>
    <span className="text-[10px] sm:text-xs text-muted-foreground text-center">{label}</span>
  </div>
);

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
  const [mainView, setMainView] = useState<'calendar' | 'status'>('calendar');
  const [activeTab, setActiveTab] = useState('in-progress');

  // Combine all quotes for calendar view
  const allQuotes = useMemo(() => {
    return [...inProgress, ...awaitingConfirmation, ...completed, ...pending];
  }, [inProgress, awaitingConfirmation, completed, pending]);

  const tabs = [
    { 
      value: 'in-progress', 
      label: 'Andamento', 
      fullLabel: 'Em Andamento',
      count: inProgress.length,
      icon: Clock,
      color: 'text-blue-500',
      quotes: inProgress,
      emptyState: {
        icon: Clock,
        title: 'Nenhum serviço em andamento',
        description: 'Quando você tiver orçamentos aceitos, eles aparecerão aqui.'
      }
    },
    { 
      value: 'awaiting', 
      label: 'Aguardando', 
      fullLabel: 'Aguardando Confirmação',
      count: awaitingConfirmation.length,
      icon: AlertCircle,
      color: 'text-amber-500',
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
      fullLabel: 'Concluídos',
      count: completed.length,
      icon: CheckCircle2,
      color: 'text-green-500',
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
      fullLabel: 'Pendentes',
      count: pending.length,
      icon: Loader2,
      color: 'text-yellow-500',
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
      fullLabel: 'Cancelados',
      count: cancelled.length,
      icon: XCircle,
      color: 'text-muted-foreground',
      quotes: cancelled,
      emptyState: {
        icon: XCircle,
        title: 'Nenhum serviço cancelado',
        description: 'Orçamentos cancelados, recusados ou expirados aparecerão aqui.'
      }
    },
  ];

  const totalServices = inProgress.length + awaitingConfirmation.length + completed.length + pending.length;

  return (
    <>
      <Helmet>
        <title>Meus Serviços | Solvoo</title>
        <meta name="description" content="Acompanhe seus serviços em andamento, concluídos e pendentes." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-20 sm:pt-24 pb-8 sm:pb-16">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          {/* Header - More compact on mobile */}
          <div className="mb-4 sm:mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-foreground">Meus Serviços</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {totalServices} {totalServices === 1 ? 'serviço' : 'serviços'} no total
                </p>
              </div>
            </div>
          </div>

          {/* Main View Toggle */}
          <div className="flex gap-2 mb-4 sm:mb-6">
            <Button
              variant={mainView === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMainView('calendar')}
              className="flex-1 sm:flex-none gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Agenda</span>
            </Button>
            <Button
              variant={mainView === 'status' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMainView('status')}
              className="flex-1 sm:flex-none gap-2"
            >
              <ListFilter className="w-4 h-4" />
              <span>Por Status</span>
            </Button>
          </div>

          {/* Stats Cards - 2x2 grid on mobile */}
          {!isLoading && (
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
              <StatCard 
                icon={Clock} 
                value={inProgress.length} 
                label="Andamento" 
                colorClass="border-blue-500/20 bg-blue-500/5 text-blue-500"
              />
              <StatCard 
                icon={AlertCircle} 
                value={awaitingConfirmation.length} 
                label="Aguardando" 
                colorClass="border-amber-500/20 bg-amber-500/5 text-amber-500"
              />
              <StatCard 
                icon={CheckCircle2} 
                value={completed.length} 
                label="Concluídos" 
                colorClass="border-green-500/20 bg-green-500/5 text-green-500"
              />
              <StatCard 
                icon={Loader2} 
                value={pending.length} 
                label="Pendentes" 
                colorClass="border-yellow-500/20 bg-yellow-500/5 text-yellow-500"
              />
            </div>
          )}

          {/* Calendar View */}
          {mainView === 'calendar' && (
            <div className="animate-fade-in">
              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Skeleton className="h-[400px]" />
                  <Skeleton className="h-[400px]" />
                </div>
              ) : (
                <AppointmentsCalendar quotes={allQuotes} userId={userId} />
              )}
            </div>
          )}

          {/* Status View */}
          {mainView === 'status' && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in">
              <div className="-mx-3 sm:-mx-4 px-3 sm:px-4 mb-4 sm:mb-6">
                <ScrollArea className="w-full">
                  <TabsList className="inline-flex w-max min-w-full sm:w-full gap-1 p-1 h-auto bg-muted/50 rounded-lg">
                    {tabs.map(tab => (
                      <TabsTrigger 
                        key={tab.value} 
                        value={tab.value}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === tab.value ? tab.color : ''}`} />
                        <span className="sm:hidden">{tab.label}</span>
                        <span className="hidden sm:inline">{tab.fullLabel}</span>
                        {tab.count > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="ml-0.5 sm:ml-1 h-4 sm:h-5 min-w-4 sm:min-w-5 flex items-center justify-center px-1 sm:px-1.5 text-[10px] sm:text-xs"
                          >
                            {tab.count}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </div>

              {isLoading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardContent className="p-0">
                        <div className="flex">
                          <Skeleton className="w-16 sm:w-24 h-[88px] sm:h-[100px]" />
                          <div className="flex-1 p-3 sm:p-4 space-y-2">
                            <Skeleton className="h-4 sm:h-5 w-3/4" />
                            <Skeleton className="h-3 sm:h-4 w-1/2" />
                            <Skeleton className="h-3 sm:h-4 w-1/3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                tabs.map(tab => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-0 animate-fade-in">
                    <QuotesList 
                      quotes={tab.quotes} 
                      userId={userId} 
                      emptyState={tab.emptyState}
                    />
                  </TabsContent>
                ))
              )}
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default MyServicesPage;
