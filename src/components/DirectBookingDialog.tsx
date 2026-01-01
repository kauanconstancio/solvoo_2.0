import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, Clock, Loader2, MapPin, Timer, CreditCard, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface DirectBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedSlot: TimeSlot | null;
  service: {
    id: string;
    title: string;
    price: string;
    user_id: string;
  };
  provider: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

const PLATFORM_FEE_RATE = 0.10; // 10% fee

export function DirectBookingDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedSlot,
  service,
  provider,
}: DirectBookingDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const getProviderInitials = () => {
    if (!provider?.full_name) return "P";
    return provider.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const parsePrice = (priceStr: string): number => {
    const cleaned = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const priceValue = parsePrice(service.price);
  const platformFee = priceValue * PLATFORM_FEE_RATE;
  const totalPrice = priceValue + platformFee;

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Autenticação necessária",
          description: "Você precisa estar logado para agendar.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // 1. Create or get conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', user.id)
        .eq('professional_id', service.user_id)
        .eq('service_id', service.id)
        .maybeSingle();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            client_id: user.id,
            professional_id: service.user_id,
            service_id: service.id,
          })
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      // 2. Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 3. Create quote with status 'accepted' (auto-accepted for fixed price)
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          conversation_id: conversationId,
          service_id: service.id,
          professional_id: service.user_id,
          client_id: user.id,
          title: service.title,
          description: `Agendamento direto para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${formatTime(selectedSlot.start_time)}`,
          price: priceValue,
          validity_days: 7,
          expires_at: expiresAt.toISOString(),
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (quoteError) throw quoteError;

      // 4. Create appointment linked to quote
      const duration = calculateDuration(selectedSlot.start_time, selectedSlot.end_time);
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: user.id,
          professional_id: service.user_id,
          service_id: service.id,
          conversation_id: conversationId,
          quote_id: quote.id,
          title: service.title,
          description: `Serviço agendado diretamente pelo cliente`,
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: selectedSlot.start_time,
          duration_minutes: duration,
          status: 'confirmed',
          client_confirmed: true,
          professional_confirmed: true,
        });

      if (appointmentError) throw appointmentError;

      // 5. Send automatic message in chat
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `📅 Agendamento confirmado!\n\n🗓 Data: ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}\n⏰ Horário: ${formatTime(selectedSlot.start_time)}\n💰 Valor: ${formatPrice(priceValue)}\n\nAguardando pagamento para confirmar.`,
        message_type: 'text',
      });

      toast({
        title: "Agendamento criado!",
        description: "Seu horário foi reservado. Finalize o pagamento no chat.",
      });

      onOpenChange(false);
      navigate(`/chat/${conversationId}`);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Erro ao agendar",
        description: error.message || "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedDate || !selectedSlot) return null;

  const duration = calculateDuration(selectedSlot.start_time, selectedSlot.end_time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Confirmar Agendamento
          </DialogTitle>
          <DialogDescription>
            Revise os detalhes e confirme seu agendamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Serviço
            </h4>
            <p className="font-semibold text-lg">{service.title}</p>
          </div>

          <Separator />

          {/* Provider Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Profissional
            </h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={provider?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getProviderInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{provider?.full_name || "Profissional"}</p>
                {provider?.city && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {provider.city}, {provider.state?.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Data e Horário
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Resumo do Pagamento
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor do serviço</span>
                <span>{formatPrice(priceValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa da plataforma (10%)</span>
                <span>{formatPrice(platformFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleConfirmBooking} 
            disabled={isSubmitting}
            className="w-full h-12"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando agendamento...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmar e ir para pagamento
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
