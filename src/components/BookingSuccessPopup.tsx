import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Clock, 
  MessageCircle, 
  User,
  PartyPopper,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookingSuccessPopupProps {
  price: number;
  serviceName: string;
  providerName: string;
  scheduledDate: Date | null;
  scheduledTime: string;
  onClose: () => void;
  conversationId: string | null;
}

// Confetti particle component
const ConfettiParticle = ({ 
  index, 
  color 
}: { 
  index: number; 
  color: string;
}) => {
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 2;
  const randomDuration = 2 + Math.random() * 2;
  const randomRotation = Math.random() * 360;

  return (
    <div
      className={cn(
        "absolute w-3 h-3 rounded-sm opacity-0",
        color
      )}
      style={{
        left: `${randomX}%`,
        top: '-10px',
        transform: `rotate(${randomRotation}deg)`,
        animation: `confetti-fall ${randomDuration}s ease-out ${randomDelay}s forwards`,
      }}
    />
  );
};

export const BookingSuccessPopup = ({
  price,
  serviceName,
  providerName,
  scheduledDate,
  scheduledTime,
  onClose,
  conversationId,
}: BookingSuccessPopupProps) => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger content animation after mount
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const confettiColors = [
    "bg-primary",
    "bg-accent",
    "bg-green-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-blue-500",
    "bg-orange-500",
  ];

  const handleGoToChat = () => {
    onClose();
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    } else {
      navigate('/chat');
    }
  };

  const handleGoToDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/60 backdrop-blur-sm">
      {/* Confetti container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <ConfettiParticle
            key={i}
            index={i}
            color={confettiColors[i % confettiColors.length]}
          />
        ))}
      </div>

      {/* Popup content */}
      <div 
        className={cn(
          "relative bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-border/50 transform transition-all duration-500",
          showContent ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success Icon with Animation */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="absolute -top-2 -right-2">
              <PartyPopper className="h-8 w-8 text-yellow-500 animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -left-2">
              <Sparkles 
                className="h-6 w-6 text-primary animate-bounce" 
                style={{ animationDelay: "0.3s" }} 
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            🎉 Agendamento Confirmado!
          </h2>

          <p className="text-muted-foreground mb-4">
            Seu serviço foi agendado e pago com sucesso
          </p>

          {/* Service Details */}
          <div className="w-full bg-muted/50 rounded-xl p-4 space-y-3 mb-4">
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Serviço</p>
              <p className="font-semibold">{serviceName}</p>
            </div>
            
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Profissional</p>
              <p className="font-medium">{providerName}</p>
            </div>

            {scheduledDate && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{format(scheduledDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{formatTime(scheduledTime)}</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Valor pago</span>
                <span className="text-xl font-bold text-primary">{formatPrice(price)}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="w-full bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Como acompanhar seu agendamento
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                Acesse o <strong>Chat</strong> para conversar com o profissional
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                Combine detalhes como local e horário exato
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                Acompanhe seus agendamentos no <strong>Painel</strong>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <Button onClick={handleGoToChat} className="w-full h-12" size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Ir para o Chat
            </Button>
            <Button onClick={handleGoToDashboard} variant="outline" className="w-full" size="lg">
              <User className="h-5 w-5 mr-2" />
              Ver Meus Agendamentos
            </Button>
          </div>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
};
