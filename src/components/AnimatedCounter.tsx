import { useCountAnimation } from '@/hooks/useCountAnimation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  isLoading?: boolean;
  className?: string;
  skeletonClassName?: string;
}

export const AnimatedCounter = ({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2000,
  isLoading = false,
  className,
  skeletonClassName = 'h-10 w-20',
}: AnimatedCounterProps) => {
  const { count, ref, isVisible } = useCountAnimation({
    end: value,
    duration,
    decimals,
  });

  if (isLoading) {
    return <Skeleton className={cn('mx-auto', skeletonClassName)} />;
  }

  return (
    <div ref={ref} className={cn('transition-opacity duration-500', className)}>
      <span className={cn(isVisible ? 'opacity-100' : 'opacity-0')}>
        {prefix}{count.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
      </span>
    </div>
  );
};

// Helper to format large numbers with k/M suffix
export const formatLargeNumber = (value: number): { displayValue: number; suffix: string } => {
  if (value >= 1000000) {
    return { displayValue: value / 1000000, suffix: 'M+' };
  }
  if (value >= 1000) {
    return { displayValue: value / 1000, suffix: 'k+' };
  }
  return { displayValue: value, suffix: value > 0 ? '+' : '' };
};
