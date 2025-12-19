import { useState, useEffect, useMemo } from "react";
import { format, isToday, parse, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Send,
  Loader2,
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
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

const allTimeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00",
];

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

  // Filter time slots based on selected date and current time
  const availableTimeSlots = useMemo(() => {
    if (!scheduledDate) return allTimeSlots;

    const now = new Date();
    
    // If selected date is today, filter out past times
    if (isToday(scheduledDate)) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      return allTimeSlots.filter((slot) => {
        const [hours, minutes] = slot.split(":").map(Number);
        // Add 30 min buffer - can't book within next 30 minutes
        if (hours > currentHour) return true;
        if (hours === currentHour && minutes > currentMinute + 30) return true;
        return false;
      });
    }

    return allTimeSlots;
  }, [scheduledDate]);

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
      if (!scheduledDate || !open) {
        setOccupiedSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const formattedDate = format(scheduledDate, "yyyy-MM-dd");
        
        // Fetch appointments for this professional on the selected date
        const { data: appointments } = await supabase
          .from("appointments")
          .select("scheduled_time")
          .eq("professional_id", user.id)
          .eq("scheduled_date", formattedDate)
          .in("status", ["pending", "confirmed"]);

        if (appointments) {
          // Extract just the time portion (HH:mm)
          const occupied = appointments.map((apt) => 
            apt.scheduled_time.substring(0, 5)
          );
          setOccupiedSlots(occupied);
        }
      } catch (error) {
        console.error("Error fetching occupied slots:", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchOccupiedSlots();
  }, [scheduledDate, open]);

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Criar orçamento
          </DialogTitle>
          <DialogDescription>
            Envie uma proposta formal com valor e prazo de validade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
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

                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando horários...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-1.5">
                    {allTimeSlots.map((time) => {
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
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">
                    {finalAvailableSlots.length} de {allTimeSlots.length} horários disponíveis
                  </div>
                  {scheduledTime && (
                    <div className="flex items-center gap-1 text-sm font-medium text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {scheduledTime}
                    </div>
                  )}
                </div>
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
