import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronLeft, ChevronRight, CalendarCheck, Sparkles, Timer, Ban } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfToday, isBefore, addDays, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useOccupiedSlots } from '@/hooks/useOccupiedSlots';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlot[];
}

interface ScheduleBlock {
  block_date: string;
  start_time: string | null;
  end_time: string | null;
}

interface ProfessionalAvailabilityProps {
  professionalId: string;
  serviceId?: string;
  serviceName?: string;
  onSlotSelect?: (date: Date, slot: TimeSlot) => void;
  selectable?: boolean;
}

export function ProfessionalAvailability({ 
  professionalId, 
  serviceId,
  serviceName,
  onSlotSelect,
  selectable = true 
}: ProfessionalAvailabilityProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfToday());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const today = startOfToday();
  const maxDate = addDays(today, 60); // Allow booking up to 60 days ahead

  // Fetch occupied slots
  const { isSlotOccupied, getOccupiedSlotsForDate } = useOccupiedSlots(professionalId, today, maxDate);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);

        const { data: schedulesData } = await supabase
          .from('professional_schedules')
          .select('*')
          .eq('user_id', professionalId)
          .eq('is_available', true);

        const schedulesWithSlots: DaySchedule[] = [];
        
        for (const schedule of schedulesData || []) {
          const { data: slotsData } = await supabase
            .from('schedule_time_slots')
            .select('*')
            .eq('schedule_id', schedule.id)
            .order('start_time');

          schedulesWithSlots.push({
            day_of_week: schedule.day_of_week,
            is_available: schedule.is_available,
            time_slots: slotsData || []
          });
        }

        setSchedules(schedulesWithSlots);

        const todayStr = today.toISOString().split('T')[0];
        const futureDate = maxDate.toISOString().split('T')[0];
        
        const { data: blocksData } = await supabase
          .from('schedule_blocks')
          .select('block_date, start_time, end_time')
          .eq('user_id', professionalId)
          .gte('block_date', todayStr)
          .lte('block_date', futureDate);

        setBlocks(blocksData || []);
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (professionalId) {
      fetchAvailability();
    }
  }, [professionalId]);

  const getAvailableSlotsForDate = (date: Date): TimeSlot[] => {
    if (isBefore(date, today)) return [];
    if (isBefore(maxDate, date)) return [];

    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');

    const dayBlock = blocks.find(b => 
      b.block_date === dateStr && !b.start_time && !b.end_time
    );
    if (dayBlock) return [];

    const schedule = schedules.find(s => s.day_of_week === dayOfWeek);
    if (!schedule || !schedule.is_available) return [];

    const blockedSlots = blocks.filter(b => 
      b.block_date === dateStr && b.start_time && b.end_time
    );

    return schedule.time_slots.filter(slot => {
      return !blockedSlots.some(block => 
        (slot.start_time >= block.start_time! && slot.start_time < block.end_time!) ||
        (slot.end_time > block.start_time! && slot.end_time <= block.end_time!)
      );
    });
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!selectable) return;
    
    if (selectedSlot?.id === slot.id) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedDate) return;

    if (!currentUserId) {
      toast({
        title: "Login necessário",
        description: "Faça login para agendar um horário.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (onSlotSelect) {
      onSlotSelect(selectedDate, selectedSlot);
      return;
    }

    const params = new URLSearchParams({
      professionalId,
      ...(serviceId && { serviceId }),
      selectedDate: format(selectedDate, 'yyyy-MM-dd'),
      selectedTime: selectedSlot.start_time,
      selectedEndTime: selectedSlot.end_time,
      ...(serviceName && { serviceName }),
    });

    navigate(`/chat/new?${params.toString()}`);
  };

  const handleDateClick = (date: Date) => {
    const slots = getAvailableSlotsForDate(date);
    if (slots.length === 0) return;
    
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
      setSelectedSlot(null);
    } else {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  const goToPreviousMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prevMonth), today)) {
      setCurrentMonth(prevMonth);
    }
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (!isBefore(maxDate, startOfMonth(nextMonth))) {
      setCurrentMonth(nextMonth);
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const selectedSlots = selectedDate ? getAvailableSlotsForDate(selectedDate) : [];

  const canGoPrevious = !isBefore(endOfMonth(subMonths(currentMonth, 1)), today);
  const canGoNext = !isBefore(maxDate, startOfMonth(addMonths(currentMonth, 1)));

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-card">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (schedules.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border shadow-sm bg-card">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Agende um Horário</h3>
              <p className="text-xs text-muted-foreground">Escolha a data e horário disponível</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium text-foreground capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={goToPreviousMonth}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={goToNextMonth}
                disabled={!canGoNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => (
                <div 
                  key={index} 
                  className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isToday = isSameDay(date, today);
                const isPast = isBefore(date, today);
                const isFuture = isBefore(maxDate, date);
                const hasSlots = getAvailableSlotsForDate(date).length > 0;
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isDisabled = !isCurrentMonth || isPast || isFuture || !hasSlots;

                return (
                  <motion.button
                    key={date.toISOString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.005 }}
                    onClick={() => !isDisabled && handleDateClick(date)}
                    disabled={isDisabled}
                    className={cn(
                      "relative h-10 w-full flex items-center justify-center text-sm rounded-full transition-all duration-150",
                      !isCurrentMonth && "text-muted-foreground/30",
                      isCurrentMonth && !isDisabled && "text-foreground hover:bg-muted",
                      isCurrentMonth && isDisabled && "text-muted-foreground/40 cursor-not-allowed",
                      isSelected && "bg-foreground text-background hover:bg-foreground",
                      isToday && !isSelected && "font-bold",
                      hasSlots && !isSelected && !isPast && isCurrentMonth && "font-medium"
                    )}
                  >
                    {format(date, 'd')}
                    {hasSlots && !isSelected && !isPast && isCurrentMonth && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center text-[10px]">1</span>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ban className="h-3 w-3 text-destructive" />
              <span>Ocupado</span>
            </div>
          </div>

          {/* Time Slots */}
          <AnimatePresence mode="wait">
            {selectedDate && (
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground capitalize">
                      {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>

                  {selectedSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedSlots.map((slot, index) => {
                        const isSlotSelected = selectedSlot?.id === slot.id;
                        const duration = calculateDuration(slot.start_time, slot.end_time);
                        const isOccupied = selectedDate ? isSlotOccupied(selectedDate, slot.start_time, slot.end_time) : false;
                        
                        return (
                          <motion.button
                            key={slot.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => !isOccupied && handleSlotClick(slot)}
                            disabled={!selectable || isOccupied}
                            className={cn(
                              "relative flex flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2.5 transition-all duration-150",
                              isOccupied && "bg-muted/50 text-muted-foreground border-muted cursor-not-allowed opacity-60",
                              !isOccupied && isSlotSelected && "bg-foreground text-background border-foreground",
                              !isOccupied && !isSlotSelected && "bg-card text-foreground border-border hover:border-foreground/30",
                              !isOccupied && selectable && "cursor-pointer",
                              !selectable && "cursor-default"
                            )}
                          >
                            {isOccupied && (
                              <div className="absolute -top-1 -right-1">
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                                  <Ban className="h-2.5 w-2.5 mr-0.5" />
                                  Ocupado
                                </Badge>
                              </div>
                            )}
                            <span className={cn(
                              "font-medium text-sm",
                              isOccupied && "line-through"
                            )}>{formatTime(slot.start_time)}</span>
                            <div className={cn(
                              "flex items-center gap-1 text-[11px]",
                              isSlotSelected && !isOccupied ? "text-background/70" : "text-muted-foreground"
                            )}>
                              <Timer className="h-3 w-3" />
                              <span>{formatDuration(duration)}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum horário disponível para esta data
                    </p>
                  )}

                  {/* Booking Confirmation */}
                  <AnimatePresence>
                    {selectable && selectedSlot && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Sparkles className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Horário selecionado</p>
                                <p className="font-medium text-foreground">
                                  {format(selectedDate, "dd/MM", { locale: ptBR })} às {formatTime(selectedSlot.start_time)}
                                  <span className="text-muted-foreground font-normal text-sm ml-1.5">
                                    ({formatDuration(calculateDuration(selectedSlot.start_time, selectedSlot.end_time))})
                                  </span>
                                </p>
                              </div>
                            </div>
                            <Button 
                              onClick={handleBookAppointment} 
                              size="sm"
                              className="rounded-lg"
                            >
                              <CalendarCheck className="h-4 w-4 mr-1.5" />
                              Agendar
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}