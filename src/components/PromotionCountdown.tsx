import { useState, useEffect } from "react";
import { Percent, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromotionCountdownProps {
  endsAt: string;
  discountPercentage: number | null;
  originalPrice: string;
  promotionalPrice: string;
}

const PromotionCountdown = ({
  endsAt,
  discountPercentage,
  originalPrice,
  promotionalPrice,
}: PromotionCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(endsAt).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  if (!timeLeft) return null;

  const formatNumber = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="bg-gradient-to-r from-destructive/10 via-destructive/5 to-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-3">
      {/* Discount Badge */}
      <div className="flex items-center justify-between">
        <Badge className="bg-destructive text-destructive-foreground font-bold text-sm px-3 py-1 flex items-center gap-1.5">
          <Percent className="h-4 w-4" />
          {discountPercentage ? `-${discountPercentage}% OFF` : "PROMOÇÃO"}
        </Badge>
        <div className="flex items-center gap-1.5 text-destructive text-sm font-medium">
          <Clock className="h-4 w-4" />
          <span>Termina em:</span>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <div className="bg-destructive text-destructive-foreground font-bold text-xl md:text-2xl px-3 py-2 rounded-lg min-w-[48px] text-center">
            {formatNumber(timeLeft.days)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">dias</span>
        </div>
        <span className="text-destructive font-bold text-xl">:</span>
        <div className="flex flex-col items-center">
          <div className="bg-destructive text-destructive-foreground font-bold text-xl md:text-2xl px-3 py-2 rounded-lg min-w-[48px] text-center">
            {formatNumber(timeLeft.hours)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">horas</span>
        </div>
        <span className="text-destructive font-bold text-xl">:</span>
        <div className="flex flex-col items-center">
          <div className="bg-destructive text-destructive-foreground font-bold text-xl md:text-2xl px-3 py-2 rounded-lg min-w-[48px] text-center">
            {formatNumber(timeLeft.minutes)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">min</span>
        </div>
        <span className="text-destructive font-bold text-xl">:</span>
        <div className="flex flex-col items-center">
          <div className="bg-destructive text-destructive-foreground font-bold text-xl md:text-2xl px-3 py-2 rounded-lg min-w-[48px] text-center">
            {formatNumber(timeLeft.seconds)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">seg</span>
        </div>
      </div>

      {/* Prices */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <span className="text-muted-foreground line-through text-lg">
          {originalPrice}
        </span>
        <span className="text-destructive font-bold text-2xl md:text-3xl">
          {promotionalPrice}
        </span>
      </div>
    </div>
  );
};

export default PromotionCountdown;
