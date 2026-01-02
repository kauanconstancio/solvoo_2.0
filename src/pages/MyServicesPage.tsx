import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { motion, AnimatePresence } from 'framer-motion';
import { AppointmentDetailsDialog } from '@/components/AppointmentDetailsDialog';
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
  ListFilter,
  Eye,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QuoteCard = ({ 
  quote, 
  userId, 
  index, 
  onViewDetails 
}: { 
  quote: UserQuote; 
  userId: string | null; 
  index: number;
  onViewDetails: (quote: UserQuote) => void;
}) => {
  const navigate = useNavigate();
  const isProfessional = quote.professional_id === userId;
  const otherPerson = isProfessional ? quote.client : quote.professional;
  const roleLabel = isProfessional ? 'Cliente' : 'Profissional';
  
  const getStatusConfig = () => {
    if (quote.client_confirmed) {
      return { label: 'Concluído', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', dotColor: 'bg-green-500' };
    }
    if (quote.completed_at && !quote.client_confirmed) {
      return { label: 'Aguardando', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dotColor: 'bg-amber-500' };
    }
    if (quote.status === 'accepted') {
      return { label: 'Em Andamento', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dotColor: 'bg-blue-500' };
    }
    if (quote.status === 'pending') {
      return { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', dotColor: 'bg-yellow-500' };
    }
    if (quote.status === 'cancelled') {
      return { label: 'Cancelado', className: 'bg-muted text-muted-foreground', dotColor: 'bg-muted-foreground' };
    }
    if (quote.status === 'rejected') {
      return { label: 'Recusado', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', dotColor: 'bg-red-500' };
    }
    if (quote.status === 'expired') {
      return { label: 'Expirado', className: 'bg-muted text-muted-foreground', dotColor: 'bg-muted-foreground' };
    }
    return { label: '', className: '', dotColor: 'bg-muted-foreground' };
  };

  const statusConfig = getStatusConfig();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails(quote);
  };

  const handleChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/chat/${quote.conversation_id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="flex">
            {/* Left accent bar */}
            <div className={`w-1 ${statusConfig.dotColor}`} />
            
            <div className="flex-1 p-4 sm:p-5">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-background shadow-sm flex-shrink-0">
                    <AvatarImage src={otherPerson?.avatar_url || undefined} />
                    <AvatarFallback className="text-sm sm:text-base bg-primary/10 text-primary font-semibold">
                      {otherPerson?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                    <p className="font-semibold text-foreground truncate text-sm sm:text-base">
                      {otherPerson?.full_name || 'Usuário'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-lg sm:text-xl text-primary">
                    {formatPrice(quote.price)}
                  </span>
                  <Badge className={`${statusConfig.className} text-[10px] sm:text-xs px-2 py-0.5 font-medium`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} mr-1.5 animate-pulse`} />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              {/* Service Title */}
              <div className="mb-3">
                <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-1 mb-0.5">
                  {quote.title}
                </h3>
                {quote.service && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                    {quote.service.title}
                  </p>
                )}
              </div>

              {/* Appointment Info */}
              {quote.appointment && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-1.5 text-xs bg-primary/5 text-primary rounded-full px-3 py-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(quote.appointment.scheduled_date + 'T12:00:00'), "dd MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs bg-primary/5 text-primary rounded-full px-3 py-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{quote.appointment.scheduled_time}</span>
                  </div>
                  {quote.appointment.location && (
                    <div className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground rounded-full px-3 py-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{quote.appointment.location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-[11px] sm:text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(quote.updated_at), { addSuffix: true, locale: ptBR })}
                </span>
                <div className="flex items-center gap-2">
                  {quote.service_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleViewDetails}
                      className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-primary"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver Serviço</span>
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleChat}
                    className="h-8 px-3 text-xs gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Conversa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4"
  >
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-5 shadow-inner">
      <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50" />
    </div>
    <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
  </motion.div>
);

const QuotesList = ({ 
  quotes, 
  userId, 
  emptyState,
  onViewDetails
}: { 
  quotes: UserQuote[]; 
  userId: string | null;
  emptyState: { icon: React.ElementType; title: string; description: string };
  onViewDetails: (quote: UserQuote) => void;
}) => {
  if (quotes.length === 0) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <AnimatePresence>
        {quotes.map((quote, index) => (
          <QuoteCard key={quote.id} quote={quote} userId={userId} index={index} onViewDetails={onViewDetails} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  colorClass,
  isActive,
  onClick
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string; 
  colorClass: string;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${colorClass} ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
  >
    <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1.5" />
    <span className="text-2xl sm:text-3xl font-bold text-foreground">{value}</span>
    <span className="text-[10px] sm:text-xs text-muted-foreground text-center font-medium">{label}</span>
  </motion.div>
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
  const [selectedQuote, setSelectedQuote] = useState<UserQuote | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const handleViewDetails = (quote: UserQuote) => {
    setSelectedQuote(quote);
    setIsDetailsDialogOpen(true);
  };

  // Combine all quotes for calendar view - deduplicate by id
  const allQuotes = useMemo(() => {
    const combined = [...inProgress, ...awaitingConfirmation, ...completed, ...pending];
    const uniqueMap = new Map<string, UserQuote>();
    combined.forEach(quote => {
      if (!uniqueMap.has(quote.id)) {
        uniqueMap.set(quote.id, quote);
      }
    });
    return Array.from(uniqueMap.values());
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

      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pt-20 sm:pt-24 pb-8 sm:pb-16">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meus Serviços</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {totalServices} {totalServices === 1 ? 'serviço ativo' : 'serviços ativos'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main View Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-5 sm:mb-6"
          >
            <Button
              variant={mainView === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMainView('calendar')}
              className={`flex-1 sm:flex-none gap-2 h-10 sm:h-11 ${mainView === 'calendar' ? 'shadow-md' : ''}`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Agenda</span>
            </Button>
            <Button
              variant={mainView === 'status' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMainView('status')}
              className={`flex-1 sm:flex-none gap-2 h-10 sm:h-11 ${mainView === 'status' ? 'shadow-md' : ''}`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Por Status</span>
            </Button>
          </motion.div>

          {/* Stats Cards */}
          {!isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8"
            >
              <StatCard 
                icon={Clock} 
                value={inProgress.length} 
                label="Andamento" 
                colorClass="border-blue-500/30 bg-blue-500/5 text-blue-500 hover:bg-blue-500/10"
                isActive={mainView === 'status' && activeTab === 'in-progress'}
                onClick={() => { setMainView('status'); setActiveTab('in-progress'); }}
              />
              <StatCard 
                icon={AlertCircle} 
                value={awaitingConfirmation.length} 
                label="Aguardando" 
                colorClass="border-amber-500/30 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10"
                isActive={mainView === 'status' && activeTab === 'awaiting'}
                onClick={() => { setMainView('status'); setActiveTab('awaiting'); }}
              />
              <StatCard 
                icon={CheckCircle2} 
                value={completed.length} 
                label="Concluídos" 
                colorClass="border-green-500/30 bg-green-500/5 text-green-500 hover:bg-green-500/10"
                isActive={mainView === 'status' && activeTab === 'completed'}
                onClick={() => { setMainView('status'); setActiveTab('completed'); }}
              />
              <StatCard 
                icon={Loader2} 
                value={pending.length} 
                label="Pendentes" 
                colorClass="border-yellow-500/30 bg-yellow-500/5 text-yellow-500 hover:bg-yellow-500/10"
                isActive={mainView === 'status' && activeTab === 'pending'}
                onClick={() => { setMainView('status'); setActiveTab('pending'); }}
              />
            </motion.div>
          )}

          {/* Calendar View */}
          <AnimatePresence mode="wait">
            {mainView === 'calendar' && (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {isLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Skeleton className="h-[400px] rounded-xl" />
                    <Skeleton className="h-[400px] rounded-xl" />
                  </div>
                ) : (
                  <AppointmentsCalendar quotes={allQuotes} userId={userId} />
                )}
              </motion.div>
            )}

            {/* Status View */}
            {mainView === 'status' && (
              <motion.div
                key="status"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="-mx-3 sm:-mx-4 px-3 sm:px-4 mb-5 sm:mb-6">
                    <ScrollArea className="w-full">
                      <TabsList className="inline-flex w-max min-w-full sm:w-full gap-1 p-1.5 h-auto bg-muted/60 backdrop-blur-sm rounded-xl">
                        {tabs.map(tab => (
                          <TabsTrigger 
                            key={tab.value} 
                            value={tab.value}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all font-medium"
                          >
                            <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === tab.value ? tab.color : ''}`} />
                            <span className="sm:hidden">{tab.label}</span>
                            <span className="hidden sm:inline">{tab.fullLabel}</span>
                            {tab.count > 0 && (
                              <Badge 
                                variant="secondary" 
                                className={`ml-0.5 sm:ml-1 h-5 sm:h-6 min-w-5 sm:min-w-6 flex items-center justify-center px-1.5 sm:px-2 text-[10px] sm:text-xs font-semibold ${activeTab === tab.value ? 'bg-primary/10 text-primary' : ''}`}
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
                    <div className="space-y-3 sm:space-y-4">
                      {[1, 2, 3].map(i => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex">
                              <Skeleton className="w-1 h-[140px]" />
                              <div className="flex-1 p-4 sm:p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="w-12 h-12 rounded-full" />
                                  <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-5 w-32" />
                                  </div>
                                  <Skeleton className="h-6 w-20" />
                                </div>
                                <Skeleton className="h-4 w-3/4" />
                                <div className="flex gap-2">
                                  <Skeleton className="h-7 w-20 rounded-full" />
                                  <Skeleton className="h-7 w-16 rounded-full" />
                                </div>
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
                          onViewDetails={handleViewDetails}
                        />
                      </TabsContent>
                    ))
                  )}
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      <AppointmentDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        quote={selectedQuote}
        userId={userId}
      />
    </>
  );
};

export default MyServicesPage;
