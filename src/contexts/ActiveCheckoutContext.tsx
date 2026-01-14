import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface ActiveCheckout {
  url: string;
  description: string;
  amount: number;
  expiresAt: string;
  createdAt: string;
  type: 'booking' | 'subscription' | 'quote';
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

interface ActiveCheckoutContextType {
  activeCheckout: ActiveCheckout | null;
  isDismissed: boolean;
  shouldShowPixDialog: boolean;
  hasActiveCheckout: boolean;
  saveCheckout: (checkout: Omit<ActiveCheckout, 'createdAt'>) => void;
  clearCheckout: () => void;
  dismissCheckout: () => void;
  reopenCheckout: () => void;
  openPixDialog: () => void;
  closePixDialog: () => void;
  goToCheckout: () => void;
}

const STORAGE_KEY = 'solvoo_active_checkout';

const ActiveCheckoutContext = createContext<ActiveCheckoutContextType | undefined>(undefined);

export const ActiveCheckoutProvider = ({ children }: { children: ReactNode }) => {
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
        
        if (expiresAt > new Date()) {
          setActiveCheckout(checkout);
        } else {
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
    setIsDismissed(true);
  }, []);

  const closePixDialog = useCallback(() => {
    setShouldShowPixDialog(false);
    setIsDismissed(false);
  }, []);

  const goToCheckout = useCallback(() => {
    if (activeCheckout?.url) {
      if (activeCheckout.url.startsWith('pix://') && activeCheckout.pixData) {
        openPixDialog();
      } else {
        window.open(activeCheckout.url, '_blank');
      }
    }
  }, [activeCheckout, openPixDialog]);

  return (
    <ActiveCheckoutContext.Provider
      value={{
        activeCheckout,
        isDismissed,
        shouldShowPixDialog,
        hasActiveCheckout: !!activeCheckout && !isDismissed,
        saveCheckout,
        clearCheckout,
        dismissCheckout,
        reopenCheckout,
        openPixDialog,
        closePixDialog,
        goToCheckout,
      }}
    >
      {children}
    </ActiveCheckoutContext.Provider>
  );
};

export const useActiveCheckout = () => {
  const context = useContext(ActiveCheckoutContext);
  if (context === undefined) {
    throw new Error('useActiveCheckout must be used within an ActiveCheckoutProvider');
  }
  return context;
};
