import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  amount_paid: number;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  plan?: {
    id: string;
    name: string;
    price: number;
    features: string[];
    max_services: number | null;
  };
}

export function useUserSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(id, name, price, features, max_services)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        // Parse features if needed
        const transformedData = {
          ...data,
          plan: data.plan ? {
            ...data.plan,
            features: Array.isArray(data.plan.features) 
              ? data.plan.features 
              : JSON.parse(data.plan.features as string || '[]'),
          } : undefined
        } as UserSubscription;
        
        setSubscription(transformedData);
      } else {
        setSubscription(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelSubscription = async () => {
    if (!subscription) return;

    try {
      const { error: cancelError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (cancelError) throw cancelError;

      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada com sucesso.',
      });

      await fetchSubscription();
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast({
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar sua assinatura.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const createSubscription = async (planId: string) => {
    try {
      const { data, error: checkoutError } = await supabase.functions.invoke(
        'create-subscription-checkout',
        { body: { planId } }
      );

      if (checkoutError) throw checkoutError;
      if (data?.error) throw new Error(data.error);

      // If free plan, subscription is already created
      if (data?.isFree) {
        toast({
          title: 'Assinatura ativada!',
          description: 'Seu plano gratuito foi ativado com sucesso.',
        });
        await fetchSubscription();
        return { success: true, isFree: true };
      }

      // Return PIX data for payment
      return {
        success: true,
        isFree: false,
        pixData: {
          pixId: data.pixId,
          brCode: data.brCode,
          brCodeBase64: data.brCodeBase64,
          amount: data.amount,
          expiresAt: data.expiresAt,
          subscriptionId: data.subscriptionId,
          planName: data.planName,
          planPrice: data.planPrice,
        }
      };
    } catch (err) {
      console.error('Error creating subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar assinatura';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const checkPaymentStatus = async (subscriptionId: string, pixId: string) => {
    try {
      const { data, error: checkError } = await supabase.functions.invoke(
        'check-subscription-payment',
        { body: { subscriptionId, pixId } }
      );

      if (checkError) throw checkError;

      if (data?.paid) {
        await fetchSubscription();
      }

      return data;
    } catch (err) {
      console.error('Error checking payment:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
    cancelSubscription,
    createSubscription,
    checkPaymentStatus,
    hasActiveSubscription: subscription?.status === 'active',
  };
}
