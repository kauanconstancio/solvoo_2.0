import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
  color?: string;
  minSize?: number;
  maxSize?: number;
  minDuration?: number;
  maxDuration?: number;
}

export const FloatingParticles = ({
  count = 20,
  className,
  color = 'hsl(var(--primary))',
  minSize = 4,
  maxSize = 12,
  minDuration = 15,
  maxDuration = 30,
}: FloatingParticlesProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay visibility to avoid layout shift
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      opacity: 0.1 + Math.random() * 0.3,
      duration: minDuration + Math.random() * (maxDuration - minDuration),
      delay: Math.random() * -maxDuration,
      drift: -20 + Math.random() * 40,
    }));
  }, [count, minSize, maxSize, minDuration, maxDuration]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none',
        className
      )}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: color,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            '--drift': `${particle.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// Variant with gradient particles
export const GradientParticles = ({
  count = 15,
  className,
}: {
  count?: number;
  className?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 60,
      opacity: 0.03 + Math.random() * 0.08,
      duration: 20 + Math.random() * 20,
      delay: Math.random() * -20,
      blur: 20 + Math.random() * 40,
    }));
  }, [count]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none',
        className
      )}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float-particle bg-gradient-to-br from-primary to-primary/50"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            filter: `blur(${particle.blur}px)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
