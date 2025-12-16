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
  const prevValueRef = useRef<string | number>(value);

  useEffect(() => {
    // Check if value changed
    if (prevValueRef.current !== value) {
      setIsAnimating(true);
      prevValueRef.current = value;

      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <Card 
      className={cn(
        'hover:shadow-soft transition-all duration-300',
        isAnimating && 'ring-2 ring-primary/50 shadow-lg',
        className
      )}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300',
            iconBgClass,
            isAnimating && 'scale-110'
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
          'text-2xl md:text-3xl font-bold transition-all duration-300',
          isAnimating && 'text-primary scale-105'
        )}>
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
};
