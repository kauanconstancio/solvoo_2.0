import { useState, useEffect, useMemo } from "react";
import { format, isToday, isBefore, startOfDay, addDays, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Send,
  Loader2,
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  title: string;
  price: string;
}

interface TimeSlotFromSchedule {
  id: string;
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlotFromSchedule[];
}

interface ScheduleBlock {
  block_date: string;
  start_time: string | null;
  end_time: string | null;
}

interface CreateQuoteDialogProps {
  conversationId: string;
  clientId: string;
  onCreateQuote: (
    clientId: string,
    title: string,
    description: string,
    price: number,
    validityDays: number,
    serviceId?: string,
    scheduledDate?: string,
    scheduledTime?: string
  ) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export const CreateQuoteDialog = ({
  conversationId,
  clientId,
  onCreateQuote,
  trigger,
}: CreateQuoteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [validityDays, setValidityDays] = useState("7");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  // Professional schedule state
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  // Fetch professional schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!open) return;
      
      setIsLoadingSchedule(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUserId(user.id);

        // Fetch schedules
        const { data: schedulesData } = await supabase
          .from('professional_schedules')
          .select('*')
          .eq('user_id', user.id)
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

        // Fetch blocks
        const todayStr = format(today, 'yyyy-MM-dd');
        const maxDateStr = format(maxDate, 'yyyy-MM-dd');
        
        const { data: blocksData } = await supabase
          .from('schedule_blocks')
          .select('block_date, start_time, end_time')
          .eq('user_id', user.id)
          .gte('block_date', todayStr)
          .lte('block_date', maxDateStr);

        setScheduleBlocks(blocksData || []);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [open]);

  // Get available slots for a specific date based on professional schedule
  const getScheduleSlotsForDate = (date: Date): string[] => {
    const dayOfWeek = getDay(date);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Check if entire day is blocked
    const dayBlock = scheduleBlocks.find(b => 
      b.block_date === dateStr && !b.start_time && !b.end_time
    );
    if (dayBlock) return [];

    // Get schedule for this day
    const schedule = schedules.find(s => s.day_of_week === dayOfWeek);
    if (!schedule || !schedule.is_available) return [];

    // Get blocked time slots for this date
    const blockedSlots = scheduleBlocks.filter(b => 
      b.block_date === dateStr && b.start_time && b.end_time
    );

    // Filter out blocked slots
    const availableSlots = schedule.time_slots.filter(slot => {
      return !blockedSlots.some(block => 
        (slot.start_time >= block.start_time! && slot.start_time < block.end_time!) ||
        (slot.end_time > block.start_time! && slot.end_time <= block.end_time!)
      );
    });

    return availableSlots.map(slot => slot.start_time.substring(0, 5));
  };

  // Check if date has any available slots
  const dateHasSlots = (date: Date): boolean => {
    if (isBefore(date, today)) return false;
    if (isBefore(maxDate, date)) return false;
    return getScheduleSlotsForDate(date).length > 0;
  };

  // Get slots from schedule for selected date
  const scheduledTimeSlots = useMemo(() => {
    if (!scheduledDate) return [];
    return getScheduleSlotsForDate(scheduledDate);
  }, [scheduledDate, schedules, scheduleBlocks]);

  // Filter time slots based on selected date and current time
  const availableTimeSlots = useMemo(() => {
    if (!scheduledDate || scheduledTimeSlots.length === 0) return [];

    const now = new Date();
    
    // If selected date is today, filter out past times
    if (isToday(scheduledDate)) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      return scheduledTimeSlots.filter((slot) => {
        const [hours, minutes] = slot.split(":").map(Number);
        // Add 30 min buffer - can't book within next 30 minutes
        if (hours > currentHour) return true;
        if (hours === currentHour && minutes > currentMinute + 30) return true;
        return false;
      });
    }

    return scheduledTimeSlots;
  }, [scheduledDate, scheduledTimeSlots]);

  // Filter out occupied slots
  const finalAvailableSlots = useMemo(() => {
    return availableTimeSlots.filter((slot) => !occupiedSlots.includes(slot));
  }, [availableTimeSlots, occupiedSlots]);

  // Reset time when date changes if the selected time is no longer available
  useEffect(() => {
    if (scheduledTime && !finalAvailableSlots.includes(scheduledTime)) {
      setScheduledTime("");
    }
  }, [finalAvailableSlots, scheduledTime]);

  // Fetch occupied slots when date changes
  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      if (!scheduledDate || !open || !userId) {
        setOccupiedSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const formattedDate = format(scheduledDate, "yyyy-MM-dd");
        
        // Fetch appointments for this professional on the selected date
        const { data: appointments } = await supabase
          .from("appointments")
          .select("scheduled_time, duration_minutes")
          .eq("professional_id", userId)
          .eq("scheduled_date", formattedDate)
          .neq("status", "cancelled");

        if (appointments) {
          // Extract occupied time slots considering duration
          const occupied: string[] = [];
          appointments.forEach((apt) => {
            const startTime = apt.scheduled_time.substring(0, 5);
            occupied.push(startTime);
            
            // Also mark overlapping slots based on duration
            const [startH, startM] = startTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = startMinutes + apt.duration_minutes;
            
            // Check each scheduled slot for overlap
            scheduledTimeSlots.forEach(slot => {
              const [slotH, slotM] = slot.split(':').map(Number);
              const slotMinutes = slotH * 60 + slotM;
              if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
                if (!occupied.includes(slot)) {
                  occupied.push(slot);
                }
              }
            });
          });
          setOccupiedSlots(occupied);
        }
      } catch (error) {
        console.error("Error fetching occupied slots:", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchOccupiedSlots();
  }, [scheduledDate, open, userId, scheduledTimeSlots]);

  useEffect(() => {
    const fetchServices = async () => {
      if (!open) return;
      
      setIsLoadingServices(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("services")
          .select("id, title, price")
          .eq("user_id", user.id)
          .eq("status", "active");

        setServices(data || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, [open]);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    
    if (serviceId && serviceId !== "none") {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        if (!title) setTitle(service.title);
        // Extract numeric price if available
        const numericPrice = service.price.replace(/[^\d,.-]/g, '').replace(',', '.');
        if (!price && !isNaN(parseFloat(numericPrice))) {
          setPrice(numericPrice);
        }
      }
    }
  };

  const formatPriceInput = (value: string) => {
    // Allow only numbers and one decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price || !scheduledDate || !scheduledTime) return;

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) return;

    setIsSubmitting(true);
    const formattedDate = format(scheduledDate, "yyyy-MM-dd");
    const success = await onCreateQuote(
      clientId,
      title.trim(),
      description.trim(),
      numericPrice,
      parseInt(validityDays),
      selectedServiceId && selectedServiceId !== "none" ? selectedServiceId : undefined,
      formattedDate,
      scheduledTime
    );
    
    setIsSubmitting(false);
    
    if (success) {
      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setValidityDays("7");
      setSelectedServiceId("");
      setScheduledDate(undefined);
      setScheduledTime("");
      setOpen(false);
    }
  };

  const isFormValid = title.trim() && price && scheduledDate && scheduledTime;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Enviar orçamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Criar orçamento
          </DialogTitle>
          <DialogDescription>
            Envie uma proposta formal com valor e prazo de validade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label>Serviço relacionado (opcional)</Label>
            <Select
              value={selectedServiceId}
              onValueChange={handleServiceSelect}
              disabled={isLoadingServices}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar serviço..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum serviço específico</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="quote-title">Título do orçamento *</Label>
            <Input
              id="quote-title"
              placeholder="Ex: Serviço de pintura residencial"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="quote-description">Descrição</Label>
            <Textarea
              id="quote-description"
              placeholder="Descreva o que está incluído neste orçamento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          {/* Price and Validity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quote-price">Valor (R$) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="quote-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(formatPriceInput(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-validity">Validade</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={validityDays} onValueChange={setValidityDays}>
                  <SelectTrigger className="pl-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Scheduling Section */}
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Data e horário do serviço *</span>
            </div>
            
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? (
                      format(scheduledDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => {
                      setScheduledDate(date);
                      setScheduledTime(""); // Reset time when date changes
                    }}
                    disabled={(date) => isBefore(date, startOfDay(new Date())) || isBefore(maxDate, date) || !dateHasSlots(date)}
                    modifiers={{
                      available: (date) => dateHasSlots(date) && !isBefore(date, today) && !isBefore(maxDate, date),
                    }}
                    modifiersClassNames={{
                      available: "font-bold text-primary",
                    }}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                  {!isLoadingSchedule && schedules.length === 0 && (
                    <div className="px-3 pb-3 text-xs text-muted-foreground text-center">
                      Configure sua agenda para disponibilizar datas
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Grid */}
            {scheduledDate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Horário</Label>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-primary/20 border border-primary/40" />
                      <span className="text-muted-foreground">Disponível</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" />
                      <span className="text-muted-foreground">Ocupado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-primary border border-primary" />
                      <span className="text-muted-foreground">Selecionado</span>
                    </div>
                  </div>
                </div>

                {isLoadingSlots || isLoadingSchedule ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando horários...</span>
                  </div>
                ) : scheduledTimeSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Ban className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Configure sua agenda para disponibilizar horários</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-1.5">
                    {scheduledTimeSlots.map((time) => {
                      const isOccupied = occupiedSlots.includes(time);
                      const isPast = !availableTimeSlots.includes(time);
                      const isUnavailable = isOccupied || isPast;
                      const isSelected = scheduledTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => setScheduledTime(time)}
                          className={cn(
                            "relative px-2 py-1.5 text-xs font-medium rounded-md transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-primary/50",
                            isSelected && "bg-primary text-primary-foreground shadow-md ring-2 ring-primary",
                            !isSelected && !isUnavailable && "bg-primary/10 text-foreground hover:bg-primary/20 border border-primary/30 hover:border-primary/50",
                            isOccupied && !isSelected && "bg-destructive/10 text-destructive/60 border border-destructive/30 cursor-not-allowed line-through",
                            isPast && !isOccupied && !isSelected && "bg-muted/50 text-muted-foreground/50 border border-transparent cursor-not-allowed"
                          )}
                          title={
                            isOccupied ? "Horário já agendado" : 
                            isPast ? "Horário já passou" : 
                            "Clique para selecionar"
                          }
                        >
                          {time}
                          {isOccupied && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Summary */}
                {scheduledTimeSlots.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground">
                      {finalAvailableSlots.length} de {scheduledTimeSlots.length} horários disponíveis
                    </div>
                    {scheduledTime && (
                      <div className="flex items-center gap-1 text-sm font-medium text-primary">
                        <Clock className="h-3.5 w-3.5" />
                        {scheduledTime}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!scheduledDate && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Selecione uma data para ver os horários disponíveis
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar orçamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
