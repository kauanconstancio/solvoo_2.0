import { useState, useEffect, useCallback } from 'react';

export interface ActiveCheckout {
  url: string;
  description: string;
  amount: number;
  expiresAt: string;
  createdAt: string;
  type: 'booking' | 'subscription' | 'quote';
  // Store full PIX data for reopening dialogs
  pixData?: {
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    appointmentId?: string;
    subscriptionId?: string;
    title: string;
    price: number;
    originalPrice?: number;
    discountApplied?: number;
  };
}

const STORAGE_KEY = 'solvoo_active_checkout';

export const useActiveCheckout = () => {
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckout | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldShowPixDialog, setShouldShowPixDialog] = useState(false);

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
    setShouldShowPixDialog(false);
  }, []);

  const dismissCheckout = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const reopenCheckout = useCallback(() => {
    setIsDismissed(false);
  }, []);

  const openPixDialog = useCallback(() => {
    setShouldShowPixDialog(true);
    setIsDismissed(true); // Hide the popup when dialog opens
  }, []);

  const closePixDialog = useCallback(() => {
    setShouldShowPixDialog(false);
    setIsDismissed(false); // Show the popup again if checkout still exists
  }, []);

  const goToCheckout = useCallback(() => {
    if (activeCheckout?.url) {
      if (activeCheckout.url.startsWith('pix://') && activeCheckout.pixData) {
        // For PIX, open the dialog
        openPixDialog();
      } else {
        window.open(activeCheckout.url, '_blank');
      }
    }
  }, [activeCheckout, openPixDialog]);

  return {
    activeCheckout,
    isDismissed,
    shouldShowPixDialog,
    saveCheckout,
    clearCheckout,
    dismissCheckout,
    reopenCheckout,
    goToCheckout,
    openPixDialog,
    closePixDialog,
    hasActiveCheckout: !!activeCheckout && !isDismissed,
  };
};
