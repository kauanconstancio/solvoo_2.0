import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billing_period: string;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  display_order: number;
  max_services: number | null;
  created_at: string;
  updated_at: string;
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform features from JSONB to string array
      const transformedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || '[]'),
      })) as SubscriptionPlan[];

      setPlans(transformedPlans);
      setError(null);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  };

  const createPlan = async (plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          ...plan,
          features: JSON.stringify(plan.features),
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPlans();
      return data;
    } catch (err) {
      console.error('Error creating plan:', err);
      throw err;
    }
  };

  const updatePlan = async (id: string, updates: Partial<SubscriptionPlan>) => {
    try {
      const updateData: any = { ...updates };
      if (updates.features) {
        updateData.features = JSON.stringify(updates.features);
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchPlans();
      return data;
    } catch (err) {
      console.error('Error updating plan:', err);
      throw err;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    isLoading,
    error,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
  };
}

export function useSubscriptionMetrics() {
  const [metrics, setMetrics] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    revenueByPlan: [] as { planName: string; revenue: number; subscribers: number }[],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);

      // Fetch all subscriptions with plan info
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(name, price)
        `);

      if (subError) throw subError;

      const activeSubscriptions = (subscriptions || []).filter(s => s.status === 'active');
      
      // Calculate revenue by plan
      const planRevenue: Record<string, { revenue: number; subscribers: number }> = {};
      
      activeSubscriptions.forEach(sub => {
        const planName = (sub.plan as any)?.name || 'Desconhecido';
        if (!planRevenue[planName]) {
          planRevenue[planName] = { revenue: 0, subscribers: 0 };
        }
        planRevenue[planName].revenue += Number(sub.amount_paid);
        planRevenue[planName].subscribers += 1;
      });

      const revenueByPlan = Object.entries(planRevenue).map(([planName, data]) => ({
        planName,
        ...data,
      }));

      const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => sum + Number(sub.amount_paid), 0);

      setMetrics({
        totalSubscribers: (subscriptions || []).length,
        activeSubscribers: activeSubscriptions.length,
        monthlyRevenue,
        revenueByPlan,
      });
    } catch (err) {
      console.error('Error fetching subscription metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    isLoading,
    refetch: fetchMetrics,
  };
}
