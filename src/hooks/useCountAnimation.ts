import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountAnimationProps {
  end: number;
  duration?: number;
  start?: number;
  decimals?: number;
}

export const useCountAnimation = ({
  end,
  duration = 2000,
  start = 0,
  decimals = 0,
}: UseCountAnimationProps) => {
  const [count, setCount] = useState(start);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);

  // Intersection Observer - tracks if element is in view
  // Robust: if the ref isn't attached yet (e.g. conditional render), we keep trying.
  useEffect(() => {
    // Fallback for environments without IntersectionObserver
    if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const tryObserve = () => {
      const element = ref.current;
      if (!element) {
        if (!cancelled) requestAnimationFrame(tryObserve);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting);
        },
        { threshold: 0.1, rootMargin: '50px' }
      );

      observer.observe(element);
    };

    tryObserve();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  // Animation effect - triggers when in view AND has a valid value
  useEffect(() => {
    // Don't animate if: not in view, already animated, or end value is 0 (loading)
    if (!isInView || hasAnimated || end === 0) {
      return;
    }

    setHasAnimated(true);
    const startTime = performance.now();
    const startValue = start;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (end - startValue) * easeOut;
      
      setCount(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInView, end, duration, start, decimals, hasAnimated]);

  // If value changes after animation completed, update to new value
  useEffect(() => {
    if (hasAnimated && end !== 0) {
      setCount(Number(end.toFixed(decimals)));
    }
  }, [end, decimals, hasAnimated]);

  return { count, ref, hasAnimated };
};
