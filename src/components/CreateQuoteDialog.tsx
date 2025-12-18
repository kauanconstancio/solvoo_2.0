import { useState, useEffect } from "react";
import {
  FileText,
  Send,
  Loader2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  title: string;
  price: string;
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
    serviceId?: string
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
    if (!title.trim() || !price) return;

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) return;

    setIsSubmitting(true);
    const success = await onCreateQuote(
      clientId,
      title.trim(),
      description.trim(),
      numericPrice,
      parseInt(validityDays),
      selectedServiceId && selectedServiceId !== "none" ? selectedServiceId : undefined
    );
    
    setIsSubmitting(false);
    
    if (success) {
      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setValidityDays("7");
      setSelectedServiceId("");
      setOpen(false);
    }
  };

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
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            disabled={!title.trim() || !price || isSubmitting}
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
