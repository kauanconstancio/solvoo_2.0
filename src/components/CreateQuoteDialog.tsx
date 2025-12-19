import { useState, useEffect } from "react";
import { format } from "date-fns";
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

const timeSlots = [
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
            
            <div className="grid grid-cols-2 gap-3">
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
                        format(scheduledDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger>
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
