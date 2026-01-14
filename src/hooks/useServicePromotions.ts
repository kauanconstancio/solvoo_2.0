import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServicePromotion {
  id: string;
  service_id: string;
  professional_id: string;
  original_price: string;
  promotional_price: string;
  discount_percentage: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  service?: {
    title: string;
    images: string[] | null;
    category: string;
  };
}

export interface CreatePromotionData {
  service_id: string;
  original_price: string;
  promotional_price: string;
  discount_percentage?: number;
  starts_at?: string;
  ends_at: string;
}

export const useServicePromotions = () => {
  const [promotions, setPromotions] = useState<ServicePromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('service_promotions')
        .select(`
          *,
          services:service_id (
            title,
            images,
            category
          )
        `)
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPromotions((data || []).map(p => ({
        ...p,
        service: p.services as any
      })));
    } catch (err: any) {
      console.error('Error fetching promotions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createPromotion = async (data: CreatePromotionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('service_promotions')
        .insert({
          ...data,
          professional_id: user.id,
          starts_at: data.starts_at || new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Promoção criada com sucesso!');
      await fetchPromotions();
      return true;
    } catch (err: any) {
      console.error('Error creating promotion:', err);
      toast.error('Erro ao criar promoção');
      return false;
    }
  };

  const updatePromotion = async (id: string, updates: Partial<ServicePromotion>) => {
    try {
      const { error } = await supabase
        .from('service_promotions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Promoção atualizada!');
      await fetchPromotions();
      return true;
    } catch (err: any) {
      console.error('Error updating promotion:', err);
      toast.error('Erro ao atualizar promoção');
      return false;
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Promoção removida!');
      await fetchPromotions();
      return true;
    } catch (err: any) {
      console.error('Error deleting promotion:', err);
      toast.error('Erro ao remover promoção');
      return false;
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return {
    promotions,
    isLoading,
    error,
    createPromotion,
    updatePromotion,
    deletePromotion,
    refetch: fetchPromotions
  };
};
