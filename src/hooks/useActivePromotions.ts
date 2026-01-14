import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivePromotion {
  service_id: string;
  discount_percentage: number | null;
  promotional_price: string;
  original_price: string;
  ends_at: string;
}

export const useActivePromotions = (serviceIds: string[]) => {
  const [promotions, setPromotions] = useState<Map<string, ActivePromotion>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (serviceIds.length === 0) {
      setPromotions(new Map());
      return;
    }

    const fetchPromotions = async () => {
      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('service_promotions')
          .select('service_id, discount_percentage, promotional_price, original_price, ends_at')
          .in('service_id', serviceIds)
          .eq('is_active', true)
          .lte('starts_at', now)
          .gte('ends_at', now);

        if (error) throw error;

        const promotionsMap = new Map<string, ActivePromotion>();
        (data || []).forEach(promo => {
          promotionsMap.set(promo.service_id, promo);
        });
        setPromotions(promotionsMap);
      } catch (err) {
        console.error('Error fetching active promotions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, [serviceIds.join(',')]);

  const getPromotion = (serviceId: string) => promotions.get(serviceId);
  const hasPromotion = (serviceId: string) => promotions.has(serviceId);

  return { promotions, isLoading, getPromotion, hasPromotion };
};

// Hook for single service
export const useServicePromotion = (serviceId: string) => {
  const [promotion, setPromotion] = useState<ActivePromotion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!serviceId) {
      setPromotion(null);
      return;
    }

    const fetchPromotion = async () => {
      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('service_promotions')
          .select('service_id, discount_percentage, promotional_price, original_price, ends_at')
          .eq('service_id', serviceId)
          .eq('is_active', true)
          .lte('starts_at', now)
          .gte('ends_at', now)
          .maybeSingle();

        if (error) throw error;
        setPromotion(data);
      } catch (err) {
        console.error('Error fetching service promotion:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotion();
  }, [serviceId]);

  return { promotion, isLoading, hasPromotion: !!promotion };
};
