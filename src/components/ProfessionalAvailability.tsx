import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, ChevronLeft, ChevronRight, CalendarOff, CalendarCheck } from 'lucide-react';
import { format, addDays, isSameDay, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

        // Fetch schedules
        const { data: schedulesData } = await supabase
          .from('professional_schedules')
          .select('*')
          .eq('user_id', professionalId)
          .eq('is_available', true);

        // Fetch time slots for each schedule
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

        // Fetch blocks for next 14 days
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

    // Check if day is blocked entirely
    const dayBlock = blocks.find(b => 
      b.block_date === dateStr && !b.start_time && !b.end_time
    );
    if (dayBlock) return [];

    // Get schedule for this day
    const schedule = schedules.find(s => s.day_of_week === dayOfWeek);
    if (!schedule || !schedule.is_available) return [];

    // Filter out blocked time slots
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

    // Navigate to chat with selected slot info
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

  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="h-16 w-12 flex-shrink-0" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no schedules configured, don't show the component
  if (schedules.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Disponibilidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Selector */}
        <div className="relative">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-1.5 overflow-hidden">
              {visibleDates.map((date) => {
                const hasSlots = getAvailableSlotsForDate(date).length > 0;
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, startOfToday());

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : hasSlots
                        ? "bg-muted hover:bg-muted/80"
                        : "bg-muted/50 text-muted-foreground",
                      !hasSlots && !isSelected && "opacity-50"
                    )}
                  >
                    <span className="text-[10px] uppercase font-medium">
                      {format(date, 'EEE', { locale: ptBR })}
                    </span>
                    <span className={cn(
                      "text-lg font-bold",
                      isToday && !isSelected && "text-primary"
                    )}>
                      {format(date, 'd')}
                    </span>
                    <span className="text-[10px]">
                      {format(date, 'MMM', { locale: ptBR })}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={scrollRight}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          
          {selectedSlots.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {selectedSlots.map((slot) => {
                  const isSlotSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      disabled={!selectable}
                      className={cn(
                        "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-all",
                        isSlotSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
                        selectable && "cursor-pointer",
                        !selectable && "cursor-default"
                      )}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </button>
                  );
                })}
              </div>
              
              {/* Book Button */}
              {selectable && selectedSlot && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Horário selecionado: </span>
                      <span className="font-medium">
                        {format(selectedDate, "dd/MM", { locale: ptBR })} às {formatTime(selectedSlot.start_time)}
                      </span>
                    </div>
                    <Button onClick={handleBookAppointment} size="sm">
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      Agendar
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
              <CalendarOff className="h-4 w-4" />
              <span>Sem horários disponíveis nesta data</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
