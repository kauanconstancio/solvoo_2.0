import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Home,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentDetails {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  conversation_id: string | null;
  service: {
    id: string;
    title: string;
    price: string;
    images: string[] | null;
  } | null;
  professional: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

export default function BookingConfirmation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        setError('ID do agendamento não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) {
          setError('Agendamento não encontrado');
          setIsLoading(false);
          return;
        }

        // Fetch service details
        let serviceData = null;
        if (data.service_id) {
          const { data: service } = await supabase
            .from('services')
            .select('id, title, price, images')
            .eq('id', data.service_id)
            .single();
          serviceData = service;
        }

        // Fetch professional details
        const { data: professional } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, city, state')
          .eq('user_id', data.professional_id)
          .single();

        setAppointment({
          ...data,
          service: serviceData,
          professional,
        });
      } catch (err: any) {
        console.error('Error fetching appointment:', err);
        setError(err.message || 'Erro ao carregar agendamento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, navigate]);

  const formatTime = (time: string) => time.slice(0, 5);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours} hora${hours > 1 ? 's' : ''}`;
  };

  const getProviderInitials = () => {
    if (!appointment?.professional?.full_name) return "P";
    return appointment.professional.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPrice = (priceStr: string) => {
    const cleaned = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
    const value = parseFloat(cleaned) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando confirmação...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Ops! Algo deu errado</h1>
            <p className="text-muted-foreground">{error || 'Agendamento não encontrado'}</p>
            <Button asChild className="w-full">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4 py-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle2 className="h-20 w-20 text-primary relative" />
          </div>
          <h1 className="text-2xl font-bold">Agendamento Confirmado!</h1>
          <p className="text-muted-foreground">
            Seu horário foi reservado com sucesso. Você receberá uma confirmação por mensagem.
          </p>
        </div>

        {/* Appointment Details Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Service */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Serviço
              </h3>
              <p className="font-semibold text-lg">
                {appointment.service?.title || appointment.title}
              </p>
              {appointment.service?.price && (
                <p className="text-primary font-semibold">
                  {formatPrice(appointment.service.price)}
                </p>
              )}
            </div>

            <Separator />

            {/* Professional */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Profissional
              </h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={appointment.professional?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getProviderInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {appointment.professional?.full_name || "Profissional"}
                  </p>
                  {appointment.professional?.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {appointment.professional.city}, {appointment.professional.state?.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Date & Time */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Data e Horário
              </h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(appointment.scheduled_date + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{formatTime(appointment.scheduled_time)}</p>
                    <p className="text-sm text-muted-foreground">
                      Duração: {formatDuration(appointment.duration_minutes)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {appointment.conversation_id && (
            <Button asChild className="w-full h-12" size="lg">
              <Link to={`/chat/${appointment.conversation_id}`}>
                <MessageCircle className="h-5 w-5 mr-2" />
                Ir para o Chat
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full h-12" size="lg">
            <Link to="/dashboard">
              <User className="h-5 w-5 mr-2" />
              Ver Meus Agendamentos
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full" size="lg">
            <Link to="/">
              <Home className="h-5 w-5 mr-2" />
              Voltar ao Início
            </Link>
          </Button>
        </div>

        {/* Info Note */}
        <p className="text-center text-sm text-muted-foreground px-4">
          Você pode conversar com o profissional pelo chat para combinar detalhes ou tirar dúvidas.
        </p>
      </div>
    </div>
  );
}
