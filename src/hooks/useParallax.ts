import { useEffect, useState, useRef, useCallback } from 'react';

interface UseParallaxOptions {
  speed?: number; // 0.1 = slow, 0.5 = medium, 1 = same as scroll
  direction?: 'up' | 'down';
  disabled?: boolean;
}

export const useParallax = ({
  speed = 0.3,
  direction = 'up',
  disabled = false,
}: UseParallaxOptions = {}) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (disabled || !ref.current) return;

    if (!ticking.current) {
      requestAnimationFrame(() => {
        const element = ref.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Calculate how much of the element is visible
        const elementCenter = rect.top + rect.height / 2;
        const distanceFromCenter = elementCenter - windowHeight / 2;

        // Apply parallax based on distance from center
        const parallaxOffset = distanceFromCenter * speed * (direction === 'up' ? 1 : -1);
        setOffset(parallaxOffset);

        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [speed, direction, disabled]);

  useEffect(() => {
    if (disabled) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, disabled]);

  return { ref, offset };
};

// Simpler version that returns style object directly
export const useParallaxStyle = (options?: UseParallaxOptions) => {
  const { ref, offset } = useParallax(options);

  return {
    ref,
    style: {
      transform: `translateY(${offset}px)`,
      willChange: 'transform',
    } as React.CSSProperties,
  };
};
