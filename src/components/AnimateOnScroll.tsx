import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface UseInViewAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useInViewAnimation = ({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: UseInViewAnimationOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
};

// Animation styles
const animationStyles = {
  'fade-up': {
    initial: 'opacity-0 translate-y-8',
    animate: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    initial: 'opacity-0 -translate-y-8',
    animate: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    initial: 'opacity-0 translate-x-8',
    animate: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    initial: 'opacity-0 -translate-x-8',
    animate: 'opacity-100 translate-x-0',
  },
  'zoom-in': {
    initial: 'opacity-0 scale-95',
    animate: 'opacity-100 scale-100',
  },
  'fade': {
    initial: 'opacity-0',
    animate: 'opacity-100',
  },
} as const;

type AnimationType = keyof typeof animationStyles;

// Animated wrapper component
interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

export const AnimateOnScroll = ({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 500,
  threshold = 0.1,
  triggerOnce = true,
}: AnimateOnScrollProps) => {
  const { ref, isInView } = useInViewAnimation({ threshold, triggerOnce });
  const style = animationStyles[animation];

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isInView ? style.animate : style.initial,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Staggered animation for lists/grids - renders children with staggered delays
interface StaggeredContainerProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  staggerDelay?: number;
  duration?: number;
  threshold?: number;
}

export const StaggeredContainer = ({
  children,
  className,
  animation = 'fade-up',
  staggerDelay = 100,
  duration = 500,
  threshold = 0.1,
}: StaggeredContainerProps) => {
  const { ref, isInView } = useInViewAnimation({ threshold, triggerOnce: true });
  const style = animationStyles[animation];

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={cn(
                'transition-all ease-out',
                isInView ? style.animate : style.initial
              )}
              style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${index * staggerDelay}ms`,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
};
