import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformMetrics {
  totalProfessionals: number;
  totalServices: number;
  averageRating: number;
  totalConversations: number;
  totalUsers: number;
}

export const usePlatformMetrics = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalProfessionals: 0,
    totalServices: 0,
    averageRating: 0,
    totalConversations: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const getCount = async (
      table: 'profiles' | 'services' | 'conversations',
      apply?: (q: ReturnType<typeof supabase.from>) => any
    ) => {
      // Use GET + range(0,0) (more reliable than HEAD for count parsing)
      let q: any = supabase.from(table).select('id', { count: 'exact' }).range(0, 0);
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
          totalConversations,
          ratingsRes,
        ] = await Promise.all([
          getCount('profiles', (q: any) => q.eq('account_type', 'profissional')),
          getCount('profiles'),
          getCount('services', (q: any) => q.eq('status', 'active')),
          getCount('conversations'),
          supabase.from('reviews').select('rating'),
        ]);

        const { data: ratingsData, error: ratingsError } = ratingsRes;
        if (ratingsError) throw ratingsError;

        let avgRating = 0;
        if (ratingsData && ratingsData.length > 0) {
          const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
          avgRating = sum / ratingsData.length;
        }

        if (!cancelled) {
          setMetrics({
            totalProfessionals,
            totalServices,
            averageRating: avgRating,
            totalConversations,
            totalUsers,
          });
        }
      } catch (error) {
        console.error('Error fetching platform metrics:', error);
        if (!cancelled) {
          setMetrics({
            totalProfessionals: 0,
            totalServices: 0,
            averageRating: 0,
            totalConversations: 0,
            totalUsers: 0,
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
