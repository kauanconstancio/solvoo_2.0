import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxHeroProps {
  children: ReactNode;
  className?: string;
  backgroundClassName?: string;
  speed?: number;
  overlay?: boolean;
  overlayOpacity?: number;
}

export const ParallaxHero = ({
  children,
  className,
  backgroundClassName,
  speed = 0.4,
  overlay = true,
  overlayOpacity = 0.05,
}: ParallaxHeroProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxOffset = scrollY * speed;

  return (
    <section
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Parallax background layer */}
      <div
        className={cn(
          'absolute inset-0 -top-20 -bottom-20 pointer-events-none',
          backgroundClassName
        )}
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          willChange: 'transform',
        }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
        
        {/* Decorative shapes */}
        <div 
          className="absolute top-10 left-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl"
          style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
        />
        <div 
          className="absolute top-20 right-[15%] w-48 h-48 rounded-full bg-primary/8 blur-2xl"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        />
        <div 
          className="absolute bottom-10 left-[30%] w-32 h-32 rounded-full bg-primary/6 blur-xl"
          style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
        />
      </div>

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 gradient-primary pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
};
