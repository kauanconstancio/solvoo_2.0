import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  startOfDay,
  addHours,
  isBefore,
  isAfter,
  getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  List,
  Grid3X3,
  LayoutGrid,
  Filter,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/hooks/useAppointments';
import BottomNavigation from '@/components/BottomNavigation';

type ViewMode = 'month' | 'week' | 'day';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusConfig = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-l-yellow-500',
    icon: AlertCircle,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-l-blue-500',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Concluído',
    color: 'bg-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-l-green-500',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-500',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-l-red-500',
    icon: XCircle,
  },
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Fetch user and appointments
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        setIsLoading(false);
        return;
      }

      // Enrich with profile data
      const enrichedAppointments = await Promise.all(
        (data || []).map(async (apt) => {
          const [clientProfile, professionalProfile, serviceData] = await Promise.all([
            supabase.from('profiles').select('full_name, avatar_url').eq('user_id', apt.client_id).maybeSingle(),
            supabase.from('profiles').select('full_name, avatar_url').eq('user_id', apt.professional_id).maybeSingle(),
            apt.service_id
              ? supabase.from('services').select('title').eq('id', apt.service_id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...apt,
            client: clientProfile.data,
            professional: professionalProfile.data,
            service: serviceData.data,
          } as Appointment;
        })
      );

      setAppointments(enrichedAppointments);
      setIsLoading(false);
    };

    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('calendar-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter === 'all') return true;
      return apt.status === statusFilter;
    });
  }, [appointments, statusFilter]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    filteredAppointments.forEach((apt) => {
      const dateKey = apt.scheduled_date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(apt);
    });
    return grouped;
  }, [filteredAppointments]);

  // Calendar days for month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  // Week days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  // Hours for day/week view
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getAppointmentsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return appointmentsByDate[dateKey] || [];
  };

  const getAppointmentsForDateAndHour = (date: Date, hour: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return (appointmentsByDate[dateKey] || []).filter((apt) => {
      const aptHour = parseInt(apt.scheduled_time.split(':')[0], 10);
      return aptHour === hour;
    });
  };

  const navigatePrevious = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const navigateNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, 'd')} - ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`;
      }
      return `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`;
    }
    return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const renderAppointmentBadge = (apt: Appointment, compact = false) => {
    const config = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.pending;
    const isProfessional = apt.professional_id === userId;
    const otherPerson = isProfessional ? apt.client : apt.professional;

    if (compact) {
      return (
        <div
          key={apt.id}
          className={cn(
            "text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
            config.bgColor,
            config.textColor
          )}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAppointment(apt);
          }}
        >
          {apt.scheduled_time.slice(0, 5)} {apt.title}
        </div>
      );
    }

    return (
      <div
        key={apt.id}
        className={cn(
          "p-2 rounded-md cursor-pointer hover:shadow-md transition-all border-l-4",
          config.bgColor,
          config.borderColor
        )}
        onClick={() => setSelectedAppointment(apt)}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-xs font-medium", config.textColor)}>
            {apt.scheduled_time.slice(0, 5)}
          </span>
          <Badge className={cn("text-[10px] px-1.5 h-4", config.bgColor, config.textColor)}>
            {config.label}
          </Badge>
        </div>
        <p className="text-sm font-medium truncate">{apt.title}</p>
        {otherPerson && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Avatar className="w-4 h-4">
              <AvatarImage src={otherPerson.avatar_url || undefined} />
              <AvatarFallback className="text-[8px]">
                {otherPerson.full_name?.charAt(0) || <User className="w-2 h-2" />}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{otherPerson.full_name}</span>
          </div>
        )}
      </div>
    );
  };

  // Selected date appointments
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return getAppointmentsForDate(selectedDate).sort((a, b) =>
      a.scheduled_time.localeCompare(b.scheduled_time)
    );
  }, [selectedDate, appointmentsByDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-hero">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <Header />

      <main className="flex-1 py-4 md:py-6 pb-24 md:pb-6">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                Calendário
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie seus agendamentos
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className="grid grid-cols-3 w-fit">
                  <TabsTrigger value="month" className="px-3">
                    <Grid3X3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="week" className="px-3">
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="day" className="px-3">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
            </div>
          </div>

          {/* Calendar Navigation */}
          <Card className="mb-6">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={navigatePrevious}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg md:text-xl capitalize">
                  {getHeaderTitle()}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={navigateNext}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  {/* Month View */}
                  {viewMode === 'month' && (
                    <>
                      {/* Week Days Header */}
                      <div className="grid grid-cols-7 border-b bg-muted/30">
                        {weekDayNames.map((day) => (
                          <div
                            key={day}
                            className="py-2 text-center text-xs font-medium text-muted-foreground"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7">
                        {monthDays.map((day, index) => {
                          const dayAppointments = getAppointmentsForDate(day);
                          const isSelected = selectedDate && isSameDay(day, selectedDate);
                          const isCurrentMonth = isSameMonth(day, currentDate);
                          const isDayToday = isToday(day);

                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedDate(day)}
                              className={cn(
                                "min-h-[80px] md:min-h-[100px] p-1 flex flex-col border-b border-r transition-colors text-left",
                                !isCurrentMonth && "text-muted-foreground/40 bg-muted/20",
                                isCurrentMonth && "hover:bg-muted/50",
                                isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                                isDayToday && !isSelected && "bg-primary/5"
                              )}
                            >
                              <span
                                className={cn(
                                  "text-xs md:text-sm font-medium mb-1",
                                  isDayToday && "text-primary font-bold",
                                  isSelected && "text-primary"
                                )}
                              >
                                {format(day, 'd')}
                              </span>
                              <div className="flex-1 space-y-0.5 overflow-hidden">
                                {dayAppointments.slice(0, 3).map((apt) =>
                                  renderAppointmentBadge(apt, true)
                                )}
                                {dayAppointments.length > 3 && (
                                  <div className="text-[10px] text-muted-foreground font-medium">
                                    +{dayAppointments.length - 3} mais
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Week View */}
                  {viewMode === 'week' && (
                    <ScrollArea className="h-[600px]">
                      <div className="min-w-[700px]">
                        {/* Header with days */}
                        <div className="grid grid-cols-8 border-b bg-muted/30 sticky top-0 z-10">
                          <div className="py-2 px-2 text-xs font-medium text-muted-foreground border-r">
                            Hora
                          </div>
                          {weekDays.map((day, i) => (
                            <div
                              key={i}
                              className={cn(
                                "py-2 text-center border-r cursor-pointer hover:bg-muted/50",
                                isToday(day) && "bg-primary/10"
                              )}
                              onClick={() => setSelectedDate(day)}
                            >
                              <div className="text-xs text-muted-foreground">
                                {weekDayNames[getDay(day)]}
                              </div>
                              <div
                                className={cn(
                                  "text-sm font-medium",
                                  isToday(day) && "text-primary font-bold"
                                )}
                              >
                                {format(day, 'd')}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Time slots */}
                        {hours.map((hour) => (
                          <div key={hour} className="grid grid-cols-8 border-b">
                            <div className="py-2 px-2 text-xs text-muted-foreground border-r">
                              {String(hour).padStart(2, '0')}:00
                            </div>
                            {weekDays.map((day, i) => {
                              const slotAppointments = getAppointmentsForDateAndHour(day, hour);
                              return (
                                <div
                                  key={i}
                                  className="min-h-[60px] p-1 border-r hover:bg-muted/30"
                                >
                                  {slotAppointments.map((apt) => renderAppointmentBadge(apt, true))}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Day View */}
                  {viewMode === 'day' && (
                    <ScrollArea className="h-[600px]">
                      <div className="p-4">
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-semibold capitalize">
                            {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                          </h3>
                        </div>
                        <div className="space-y-1">
                          {hours.map((hour) => {
                            const slotAppointments = getAppointmentsForDateAndHour(currentDate, hour);
                            return (
                              <div key={hour} className="flex gap-4 min-h-[60px]">
                                <div className="w-16 py-2 text-sm text-muted-foreground">
                                  {String(hour).padStart(2, '0')}:00
                                </div>
                                <div className="flex-1 border-l pl-4 py-1 space-y-2">
                                  {slotAppointments.map((apt) => renderAppointmentBadge(apt))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Selected Date Appointments */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="sticky top-20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    {selectedDate
                      ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                      : 'Selecione uma data'}
                  </CardTitle>
                  {selectedDate && (
                    <p className="text-xs text-muted-foreground">
                      {selectedDateAppointments.length} agendamento(s)
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px]">
                    {selectedDateAppointments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <CalendarIcon className="w-6 h-6 text-muted-foreground/60" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Nenhum agendamento
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Não há serviços agendados para esta data
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateAppointments.map((apt) => {
                          const config =
                            statusConfig[apt.status as keyof typeof statusConfig] ||
                            statusConfig.pending;
                          const isProfessional = apt.professional_id === userId;
                          const otherPerson = isProfessional ? apt.client : apt.professional;

                          return (
                            <Card
                              key={apt.id}
                              className={cn(
                                "cursor-pointer hover:shadow-md transition-all border-l-4",
                                config.borderColor
                              )}
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                                      <Clock className="w-3.5 h-3.5" />
                                      {apt.scheduled_time.slice(0, 5)}
                                    </div>
                                    <Badge
                                      className={cn(
                                        "text-[10px] px-1.5",
                                        config.bgColor,
                                        config.textColor
                                      )}
                                    >
                                      {config.label}
                                    </Badge>
                                  </div>
                                </div>

                                <h4 className="font-medium text-sm line-clamp-1 mb-1.5">
                                  {apt.title}
                                </h4>

                                {otherPerson && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Avatar className="w-4 h-4">
                                      <AvatarImage src={otherPerson.avatar_url || undefined} />
                                      <AvatarFallback className="text-[8px]">
                                        {otherPerson.full_name?.charAt(0) || (
                                          <User className="w-2 h-2" />
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {otherPerson.full_name || 'Usuário'}
                                    </span>
                                  </div>
                                )}

                                {apt.location && (
                                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{apt.location}</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Legend - Inside the sticky card */}
                <div className="border-t px-4 py-3 bg-card">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Legenda</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(statusConfig).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", value.color)} />
                        <span className="text-xs">{value.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Detalhes do Agendamento
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedAppointment.title}</h3>
                  {selectedAppointment.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedAppointment.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(parseISO(selectedAppointment.scheduled_date), "d 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Horário</p>
                    <p className="font-medium">{selectedAppointment.scheduled_time.slice(0, 5)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge
                    className={cn(
                      statusConfig[selectedAppointment.status as keyof typeof statusConfig]
                        ?.bgColor,
                      statusConfig[selectedAppointment.status as keyof typeof statusConfig]
                        ?.textColor
                    )}
                  >
                    {statusConfig[selectedAppointment.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>

                {selectedAppointment.location && (
                  <div>
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {selectedAppointment.location}
                    </p>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Observações</p>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {selectedAppointment.conversation_id && (
                    <Button asChild className="flex-1">
                      <Link to={`/chat/${selectedAppointment.conversation_id}`}>
                        Abrir Conversa
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default CalendarPage;
