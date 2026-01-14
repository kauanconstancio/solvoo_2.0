import { useActiveCheckout } from '@/contexts/ActiveCheckoutContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, CreditCard, Clock, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PixBookingCheckoutDialog } from './PixBookingCheckoutDialog';
import { SubscriptionCheckoutDialog } from './SubscriptionCheckoutDialog';

const ActiveCheckoutPopup = () => {
  const { 
    activeCheckout, 
    hasActiveCheckout, 
    dismissCheckout, 
    clearCheckout,
    shouldShowPixDialog,
    openPixDialog,
    closePixDialog,
  } = useActiveCheckout();
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!activeCheckout) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(activeCheckout.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        clearCheckout();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeCheckout, clearCheckout]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleCancelCheckout = async () => {
    try {
      // If this is a booking created by PIX, cancel the pending appointment in the backend
      if (activeCheckout?.type === 'booking' && activeCheckout.pixData?.appointmentId) {
        await supabase.functions.invoke('cancel-booking-checkout', {
          body: { appointmentId: activeCheckout.pixData.appointmentId },
        });
      }
    } catch (error) {
      console.error('Error cancelling checkout:', error);
    } finally {
      clearCheckout();
    }
  };

  const handleReturnToCheckout = () => {
    if (activeCheckout?.pixData) {
      openPixDialog();
    }
  };

  const handlePixDialogClose = (open: boolean) => {
    if (!open) {
      closePixDialog();
    }
  };

  const handlePaymentConfirmed = () => {
    clearCheckout();
  };

  // Build pixData for the dialog from activeCheckout
  const pixDialogData = activeCheckout?.pixData ? {
    pixId: activeCheckout.pixData.pixId,
    brCode: activeCheckout.pixData.brCode,
    brCodeBase64: activeCheckout.pixData.brCodeBase64,
    amount: activeCheckout.amount,
    expiresAt: activeCheckout.expiresAt,
    title: activeCheckout.pixData.title,
    price: activeCheckout.pixData.price,
    originalPrice: activeCheckout.pixData.originalPrice,
    discountApplied: activeCheckout.pixData.discountApplied,
    appointmentId: activeCheckout.pixData.appointmentId || '',
  } : null;

  return (
    <>
      <AnimatePresence>
        {hasActiveCheckout && activeCheckout && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-96"
          >
            <Card className="relative overflow-hidden border-primary/20 bg-card/95 backdrop-blur-lg shadow-2xl">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-primary/60"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ 
                    duration: (new Date(activeCheckout.expiresAt).getTime() - Date.now()) / 1000,
                    ease: 'linear'
                  }}
                />
              </div>

              <button
                onClick={dismissCheckout}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="p-4 pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">Pagamento pendente</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {activeCheckout.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {formatAmount(activeCheckout.amount)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Expira em {timeLeft}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelCheckout}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReturnToCheckout}
                      className="text-xs gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Retomar</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIX Dialog for booking */}
      {activeCheckout?.type === 'booking' && pixDialogData && (
        <PixBookingCheckoutDialog
          open={shouldShowPixDialog}
          onOpenChange={handlePixDialogClose}
          appointmentId={activeCheckout.pixData?.appointmentId || null}
          pixData={pixDialogData}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}

      {/* Subscription PIX Dialog */}
      {activeCheckout?.type === 'subscription' && shouldShowPixDialog && activeCheckout.pixData && (
        <SubscriptionCheckoutDialog
          open={shouldShowPixDialog}
          onOpenChange={handlePixDialogClose}
          pixData={{
            pixId: activeCheckout.pixData.pixId,
            brCode: activeCheckout.pixData.brCode,
            brCodeBase64: activeCheckout.pixData.brCodeBase64,
            amount: activeCheckout.amount,
            expiresAt: activeCheckout.expiresAt,
            subscriptionId: activeCheckout.pixData.subscriptionId || '',
            planName: activeCheckout.pixData.title,
            planPrice: activeCheckout.pixData.price,
          }}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}
    </>
  );
};

export default ActiveCheckoutPopup;
