import { useEffect, useRef, useState, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnimatedMetricCardProps {
  value: string | number;
  label: string;
  icon: ReactNode;
  iconBgClass: string;
  badge?: string;
  className?: string;
}

export const AnimatedMetricCard = ({
  value,
  label,
  icon,
  iconBgClass,
  badge,
  className,
}: AnimatedMetricCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef<string | number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevValueRef.current = value;
      return;
    }

    // Check if value actually changed
    if (prevValueRef.current !== value) {
      console.log(`[AnimatedMetricCard] ${label} changed: ${prevValueRef.current} -> ${value}`);
      prevValueRef.current = value;
      
      // Trigger animation
      setIsAnimating(true);

      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [value, label]);

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-soft',
        className
      )}
    >
      {/* Animated highlight overlay */}
      <div 
        className={cn(
          'absolute inset-0 bg-primary/10 transition-opacity duration-500',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />
      
      {/* Pulse ring animation */}
      {isAnimating && (
        <div className="absolute inset-0 animate-ping-once rounded-lg ring-2 ring-primary/50" />
      )}
      
      <CardContent className="p-4 md:p-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-500',
            iconBgClass,
            isAnimating && 'scale-125'
          )}>
            {icon}
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className={cn(
          'text-2xl md:text-3xl font-bold transition-all duration-500 origin-left',
          isAnimating && 'text-primary scale-110'
        )}>
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
};
