import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformMetrics {
  totalProfessionals: number;
  totalServices: number;
  averageRating: number;
  totalCompletedServices: number;
  totalUsers: number;
  totalAmountMoved: number;
}

export const usePlatformMetrics = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalProfessionals: 0,
    totalServices: 0,
    averageRating: 0,
    totalCompletedServices: 0,
    totalUsers: 0,
    totalAmountMoved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const getCount = async (
      table: string,
      apply?: (q: any) => any
    ) => {
      // Use GET + range(0,0) (more reliable than HEAD for count parsing)
      let q: any = (supabase.from as any)(table).select('*', { count: 'exact', head: true });
      if (apply) q = apply(q);

      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    };

    const fetchMetrics = async () => {
      try {
        const [
          totalProfessionals,
          totalUsers,
          totalServices,
          totalCompletedServices,
          ratingsRes,
          amountRes,
        ] = await Promise.all([
          getCount('profiles_public', (q: any) => q.eq('account_type', 'profissional')),
          getCount('profiles_public'),
          getCount('services', (q: any) => q.eq('status', 'active')),
          getCount('quotes', (q: any) => q.in('status', ['accepted', 'completed'])),
          supabase.from('reviews').select('rating'),
          supabase.from('wallet_transactions').select('amount').eq('type', 'credit').eq('status', 'completed'),
        ]);

        const { data: ratingsData, error: ratingsError } = ratingsRes;
        if (ratingsError) throw ratingsError;

        const { data: amountData, error: amountError } = amountRes;
        if (amountError) throw amountError;

        let avgRating = 0;
        if (ratingsData && ratingsData.length > 0) {
          const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
          avgRating = sum / ratingsData.length;
        }

        let totalAmount = 0;
        if (amountData && amountData.length > 0) {
          totalAmount = amountData.reduce((acc, t) => acc + t.amount, 0);
        }

        if (!cancelled) {
          setMetrics({
            totalProfessionals,
            totalServices,
            averageRating: avgRating,
            totalCompletedServices,
            totalUsers,
            totalAmountMoved: totalAmount,
          });
        }
      } catch (error) {
        console.error('Error fetching platform metrics:', error);
        if (!cancelled) {
          setMetrics({
            totalProfessionals: 0,
            totalServices: 0,
            averageRating: 0,
            totalCompletedServices: 0,
            totalUsers: 0,
            totalAmountMoved: 0,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchMetrics();

    return () => {
      cancelled = true;
    };
  }, []);

  return { metrics, isLoading };
};

export const formatMetricValue = (value: number, type: 'number' | 'rating' = 'number'): string => {
  if (type === 'rating') {
    return value > 0 ? value.toFixed(1) : '-';
  }
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M+`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k+`;
  }
  return value > 0 ? `${value}+` : '0';
};
