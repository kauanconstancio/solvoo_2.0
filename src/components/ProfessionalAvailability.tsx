import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, ChevronLeft, ChevronRight, CalendarCheck, Sparkles, Timer } from 'lucide-react';
import { format, addDays, isSameDay, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const DAYS_TO_SHOW = 7;
  const TOTAL_DAYS = 14;

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

        const today = new Date().toISOString().split('T')[0];
        const futureDate = addDays(new Date(), TOTAL_DAYS).toISOString().split('T')[0];
        
        const { data: blocksData } = await supabase
          .from('schedule_blocks')
          .select('block_date, start_time, end_time')
          .eq('user_id', professionalId)
          .gte('block_date', today)
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

  const getDates = () => {
    const dates: Date[] = [];
    for (let i = 0; i < TOTAL_DAYS; i++) {
      dates.push(addDays(startOfToday(), i));
    }
    return dates;
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

  const allDates = getDates();
  const visibleDates = allDates.slice(startIndex, startIndex + DAYS_TO_SHOW);
  const selectedSlots = getAvailableSlotsForDate(selectedDate);

  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + DAYS_TO_SHOW < allDates.length;

  const scrollLeft = () => {
    if (canScrollLeft) setStartIndex(prev => prev - 1);
  };

  const scrollRight = () => {
    if (canScrollRight) setStartIndex(prev => prev + 1);
  };

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="h-20 w-14 rounded-xl flex-shrink-0" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-xl" />
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
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Agende um Horário</h3>
              <p className="text-xs text-muted-foreground">Escolha a data e horário disponível</p>
            </div>
          </div>
        </div>

        <div className="p-5 pt-4 space-y-5">
          {/* Date Selector */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                onClick={scrollLeft}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2 overflow-hidden flex-1 justify-center">
                {visibleDates.map((date, index) => {
                  const hasSlots = getAvailableSlotsForDate(date).length > 0;
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, startOfToday());

                  return (
                    <motion.button
                      key={date.toISOString()}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl min-w-[52px] transition-all duration-200",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                          : hasSlots
                          ? "bg-muted/60 hover:bg-muted hover:scale-102"
                          : "bg-muted/30 text-muted-foreground/60",
                        !hasSlots && !isSelected && "cursor-not-allowed"
                      )}
                      disabled={!hasSlots && !isSelected}
                    >
                      {isToday && !isSelected && (
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                      <span className={cn(
                        "text-[10px] uppercase font-medium tracking-wide",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {format(date, 'EEE', { locale: ptBR })}
                      </span>
                      <span className={cn(
                        "text-xl font-bold leading-tight",
                        isToday && !isSelected && "text-primary"
                      )}>
                        {format(date, 'd')}
                      </span>
                      <span className={cn(
                        "text-[10px]",
                        isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {format(date, 'MMM', { locale: ptBR })}
                      </span>
                      {hasSlots && !isSelected && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                onClick={scrollRight}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Date Label */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/50" />
            <p className="text-xs font-medium text-muted-foreground px-2 capitalize">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {/* Time Slots */}
          <AnimatePresence mode="wait">
            {selectedSlots.length > 0 ? (
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedSlots.map((slot, index) => {
                    const isSlotSelected = selectedSlot?.id === slot.id;
                    const duration = calculateDuration(slot.start_time, slot.end_time);
                    return (
                      <motion.button
                        key={slot.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!selectable}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 transition-all duration-200",
                          isSlotSelected
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                            : "bg-muted/60 text-foreground hover:bg-muted hover:scale-102",
                          selectable && "cursor-pointer",
                          !selectable && "cursor-default"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className={cn(
                            "h-3.5 w-3.5",
                            isSlotSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                          )} />
                          <span className="font-semibold text-sm">{formatTime(slot.start_time)}</span>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-[11px]",
                          isSlotSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          <Timer className="h-3 w-3" />
                          <span>{formatDuration(duration)}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                
                {/* Booking Confirmation */}
                <AnimatePresence>
                  {selectable && selectedSlot && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Horário selecionado</p>
                              <p className="font-semibold text-foreground">
                                {format(selectedDate, "dd/MM", { locale: ptBR })} às {formatTime(selectedSlot.start_time)}
                                <span className="text-muted-foreground font-normal text-sm ml-2">
                                  ({formatDuration(calculateDuration(selectedSlot.start_time, selectedSlot.end_time))})
                                </span>
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={handleBookAppointment} 
                            className="rounded-xl shadow-lg shadow-primary/20"
                          >
                            <CalendarCheck className="h-4 w-4 mr-2" />
                            Agendar
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sem horários disponíveis
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Selecione outra data para ver a disponibilidade
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}