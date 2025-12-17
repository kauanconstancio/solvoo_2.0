import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformMetrics {
  totalProfessionals: number;
  totalServices: number;
  averageRating: number;
  totalConversations: number;
}

export const usePlatformMetrics = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalProfessionals: 0,
    totalServices: 0,
    averageRating: 0,
    totalConversations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch professionals count (profiles with account_type = 'profissional')
        const { count: professionalsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'profissional');

        // Fetch total active services
        const { count: servicesCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch average rating
        const { data: ratingsData } = await supabase
          .from('reviews')
          .select('rating');

        let avgRating = 0;
        if (ratingsData && ratingsData.length > 0) {
          const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
          avgRating = sum / ratingsData.length;
        }

        // Fetch total conversations (as a proxy for services completed/contacted)
        const { count: conversationsCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true });

        setMetrics({
          totalProfessionals: professionalsCount || 0,
          totalServices: servicesCount || 0,
          averageRating: avgRating,
          totalConversations: conversationsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching platform metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
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
