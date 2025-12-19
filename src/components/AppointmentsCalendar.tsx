import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { UserQuote } from '@/hooks/useUserQuotes';

interface AppointmentsCalendarProps {
  quotes: UserQuote[];
  userId: string | null;
}

const AppointmentsCalendar = ({ quotes, userId }: AppointmentsCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Get appointments with dates
  const appointmentsWithDates = useMemo(() => {
    return quotes.filter(q => q.appointment?.scheduled_date);
  }, [quotes]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, UserQuote[]> = {};
    appointmentsWithDates.forEach(quote => {
      if (quote.appointment?.scheduled_date) {
        const dateKey = quote.appointment.scheduled_date;
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(quote);
      }
    });
    return grouped;
  }, [appointmentsWithDates]);

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return appointmentsByDate[dateKey] || [];
  }, [selectedDate, appointmentsByDate]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
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
  }, [currentMonth]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getAppointmentCountForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return appointmentsByDate[dateKey]?.length || 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusConfig = (quote: UserQuote) => {
    if (quote.client_confirmed) {
      return { label: 'Concluído', className: 'bg-green-500/10 text-green-600 dark:text-green-400' };
    }
    if (quote.status === 'accepted') {
      return { label: 'Confirmado', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' };
    }
    if (quote.status === 'pending') {
      return { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' };
    }
    return { label: quote.status, className: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Calendar */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-sm sm:text-base capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b">
            {weekDays.map(day => (
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
            {calendarDays.map((day, index) => {
              const appointmentCount = getAppointmentCountForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative aspect-square p-1 flex flex-col items-center justify-center border-b border-r transition-colors",
                    !isCurrentMonth && "text-muted-foreground/40 bg-muted/20",
                    isCurrentMonth && "hover:bg-muted/50",
                    isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                    isDayToday && !isSelected && "bg-primary/5"
                  )}
                >
                  <span className={cn(
                    "text-xs sm:text-sm font-medium",
                    isDayToday && "text-primary font-bold",
                    isSelected && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {appointmentCount > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {appointmentCount <= 3 ? (
                        Array.from({ length: appointmentCount }).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                        ))
                      ) : (
                        <Badge variant="secondary" className="h-4 text-[10px] px-1">
                          {appointmentCount}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Appointments */}
      <Card>
        <CardContent className="p-0">
          <div className="p-3 sm:p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">
                {selectedDate ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
              </h3>
            </div>
            {selectedDate && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedDateAppointments.length} agendamento(s)
              </p>
            )}
          </div>

          <ScrollArea className="h-[300px] sm:h-[360px]">
            {selectedDateAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <CalendarIcon className="w-6 h-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum agendamento</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Não há serviços agendados para esta data
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {selectedDateAppointments
                  .sort((a, b) => {
                    const timeA = a.appointment?.scheduled_time || '00:00';
                    const timeB = b.appointment?.scheduled_time || '00:00';
                    return timeA.localeCompare(timeB);
                  })
                  .map(quote => {
                    const isProfessional = quote.professional_id === userId;
                    const otherPerson = isProfessional ? quote.client : quote.professional;
                    const statusConfig = getStatusConfig(quote);

                    return (
                      <Link
                        key={quote.id}
                        to={`/chat/${quote.conversation_id}`}
                        className="block"
                      >
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-primary">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                                  <Clock className="w-3.5 h-3.5" />
                                  {quote.appointment?.scheduled_time}
                                </div>
                                <Badge className={cn("text-[10px] px-1.5", statusConfig.className)}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <span className="font-bold text-sm text-primary">
                                {formatPrice(quote.price)}
                              </span>
                            </div>

                            <h4 className="font-medium text-sm line-clamp-1 mb-1.5">
                              {quote.title}
                            </h4>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={otherPerson?.avatar_url || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {otherPerson?.full_name?.charAt(0) || <User className="w-2 h-2" />}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{otherPerson?.full_name || 'Usuário'}</span>
                            </div>

                            {quote.appointment?.location && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{quote.appointment.location}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsCalendar;
