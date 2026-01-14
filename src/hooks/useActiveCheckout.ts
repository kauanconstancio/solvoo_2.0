import { useState, useEffect, useCallback } from 'react';

export interface ActiveCheckout {
  url: string;
  description: string;
  amount: number;
  expiresAt: string;
  createdAt: string;
  type: 'booking' | 'subscription' | 'quote';
}

const STORAGE_KEY = 'solvoo_active_checkout';

export const useActiveCheckout = () => {
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckout | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Load active checkout from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const checkout: ActiveCheckout = JSON.parse(stored);
        const expiresAt = new Date(checkout.expiresAt);
        
        // Check if checkout is still valid (not expired)
        if (expiresAt > new Date()) {
          setActiveCheckout(checkout);
        } else {
          // Expired, remove it
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveCheckout = useCallback((checkout: Omit<ActiveCheckout, 'createdAt'>) => {
    const fullCheckout: ActiveCheckout = {
      ...checkout,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullCheckout));
    setActiveCheckout(fullCheckout);
    setIsDismissed(false);
  }, []);

  const clearCheckout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveCheckout(null);
    setIsDismissed(false);
  }, []);

  const dismissCheckout = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const reopenCheckout = useCallback(() => {
    setIsDismissed(false);
  }, []);

  const goToCheckout = useCallback(() => {
    if (activeCheckout?.url) {
      window.open(activeCheckout.url, '_blank');
    }
  }, [activeCheckout]);

  return {
    activeCheckout,
    isDismissed,
    saveCheckout,
    clearCheckout,
    dismissCheckout,
    reopenCheckout,
    goToCheckout,
    hasActiveCheckout: !!activeCheckout && !isDismissed,
  };
};
