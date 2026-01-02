import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AddressMapPreview } from '@/components/AddressMapPreview';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  MessageCircle, 
  ExternalLink,
  DollarSign,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { UserQuote } from '@/hooks/useUserQuotes';

interface AppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: UserQuote | null;
  userId: string | null;
}

export function AppointmentDetailsDialog({ 
  open, 
  onOpenChange, 
  quote, 
  userId 
}: AppointmentDetailsDialogProps) {
  const navigate = useNavigate();
  
  if (!quote) return null;

  const isProfessional = quote.professional_id === userId;
  const otherPerson = isProfessional ? quote.client : quote.professional;
  const roleLabel = isProfessional ? 'Cliente' : 'Profissional';

  const getStatusConfig = () => {
    if (quote.client_confirmed) {
      return { label: 'Concluído', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', dotColor: 'bg-green-500' };
    }
    if (quote.completed_at && !quote.client_confirmed) {
      return { label: 'Aguardando Confirmação', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dotColor: 'bg-amber-500' };
    }
    if (quote.status === 'accepted') {
      return { label: 'Em Andamento', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dotColor: 'bg-blue-500' };
    }
    if (quote.status === 'pending') {
      return { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', dotColor: 'bg-yellow-500' };
    }
    if (quote.status === 'cancelled') {
      return { label: 'Cancelado', className: 'bg-muted text-muted-foreground', dotColor: 'bg-muted-foreground' };
    }
    if (quote.status === 'rejected') {
      return { label: 'Recusado', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', dotColor: 'bg-red-500' };
    }
    if (quote.status === 'expired') {
      return { label: 'Expirado', className: 'bg-muted text-muted-foreground', dotColor: 'bg-muted-foreground' };
    }
    return { label: '', className: '', dotColor: 'bg-muted-foreground' };
  };

  const statusConfig = getStatusConfig();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleChat = () => {
    onOpenChange(false);
    navigate(`/chat/${quote.conversation_id}`);
  };

  const handleViewService = () => {
    onOpenChange(false);
    if (quote.service_id) {
      navigate(`/servico/${quote.service_id}`);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <DialogTitle className="text-lg font-semibold">Detalhes do Serviço</DialogTitle>
            <Badge className={`${statusConfig.className} text-xs px-2 py-0.5 font-medium w-fit flex-shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} mr-1.5 animate-pulse`} />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* Professional/Client Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-background shadow-sm flex-shrink-0">
            <AvatarImage src={otherPerson?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm sm:text-base">
              {otherPerson?.full_name?.charAt(0) || <User className="w-4 h-4 sm:w-5 sm:h-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
            <p className="font-semibold text-foreground truncate text-sm sm:text-base">
              {otherPerson?.full_name || 'Usuário'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="font-bold text-base sm:text-lg text-primary">{formatPrice(quote.price)}</p>
          </div>
        </div>

        {/* Service Title */}
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{quote.title}</h3>
          {quote.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{quote.description}</p>
          )}
          {quote.service && (
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-primary text-sm gap-1"
              onClick={handleViewService}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver página do serviço
            </Button>
          )}
        </div>

        <Separator />

        {/* Appointment Details */}
        {quote.appointment && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Agendamento
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(quote.appointment.scheduled_date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Horário</p>
                  <p className="text-sm font-medium text-foreground">
                    {quote.appointment.scheduled_time}
                  </p>
                </div>
              </div>
            </div>


            {/* Location with Map */}
            {quote.appointment.location && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="text-sm font-medium text-foreground">{quote.appointment.location}</p>
                  </div>
                </div>
                
                <AddressMapPreview 
                  address={quote.appointment.location} 
                  className="h-48 w-full rounded-lg border border-border shadow-sm" 
                />
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={handleChat}
          >
            <MessageCircle className="w-4 h-4" />
            Abrir Conversa
          </Button>
          {quote.service && (
            <Button 
              variant="default" 
              className="flex-1 gap-2"
              onClick={handleViewService}
            >
              <ExternalLink className="w-4 h-4" />
              Ver Serviço
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
