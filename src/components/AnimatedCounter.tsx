import { useCountAnimation } from '@/hooks/useCountAnimation';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  isLoading?: boolean;
  className?: string;
}

export const AnimatedCounter = ({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2000,
  isLoading = false,
  className,
}: AnimatedCounterProps) => {
  const { count, ref, isVisible } = useCountAnimation({
    end: value,
    duration,
    decimals,
  });

  if (isLoading) {
    return <span className="inline-block w-12 h-6 bg-muted animate-pulse rounded" />;
  }

  return (
    <span ref={ref} className={cn('inline-block transition-opacity duration-500', isVisible ? 'opacity-100' : 'opacity-0', className)}>
      {prefix}{count.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
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
