import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoyaltyConfig {
  id: string;
  points_per_real: number;
  min_points_redemption: number;
  point_value_in_reais: number;
  is_active: boolean;
}

interface UserLoyaltyPoints {
  id: string;
  user_id: string;
  total_points: number;
  lifetime_points: number;
}

interface LoyaltyTransaction {
  id: string;
  user_id: string;
  points: number;
  type: 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';
  description: string;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

interface LoyaltyRedemption {
  id: string;
  user_id: string;
  points_used: number;
  discount_value: number;
  quote_id: string | null;
  status: 'pending' | 'applied' | 'cancelled' | 'expired';
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

export const useLoyaltyConfig = () => {
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('loyalty_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setConfig(data as unknown as LoyaltyConfig);
      }
      setIsLoading(false);
    };

    fetchConfig();
  }, []);

  return { config, isLoading };
};

export const useUserLoyaltyPoints = () => {
  const [points, setPoints] = useState<UserLoyaltyPoints | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPoints = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error) {
      setPoints(data as unknown as UserLoyaltyPoints | null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  return { points, isLoading, refetch: fetchPoints };
};

export const useLoyaltyTransactions = () => {
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data as unknown as LoyaltyTransaction[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return { transactions, isLoading, refetch: fetchTransactions };
};

export const useLoyaltyRedemptions = () => {
  const [redemptions, setRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [pendingRedemption, setPendingRedemption] = useState<LoyaltyRedemption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRedemptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('loyalty_redemptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const typed = data as unknown as LoyaltyRedemption[];
      setRedemptions(typed);
      // Find pending redemption that hasn't expired
      const pending = typed.find(r => 
        r.status === 'pending' && new Date(r.expires_at) > new Date()
      );
      setPendingRedemption(pending || null);
    }
    setIsLoading(false);
  };

  const createRedemption = async (pointsToRedeem: number, discountValue: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('loyalty_redemptions')
      .insert({
        user_id: user.id,
        points_used: pointsToRedeem,
        discount_value: discountValue,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro ao resgatar pontos',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }

    toast({
      title: 'Pontos resgatados!',
      description: `Você tem R$ ${discountValue.toFixed(2)} de desconto disponível por 24h`
    });

    await fetchRedemptions();
    return data as unknown as LoyaltyRedemption;
  };

  const cancelRedemption = async (redemptionId: string) => {
    const { error } = await supabase
      .from('loyalty_redemptions')
      .update({ status: 'cancelled' })
      .eq('id', redemptionId);

    if (error) {
      toast({
        title: 'Erro ao cancelar resgate',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'Resgate cancelado',
      description: 'Seus pontos foram devolvidos'
    });

    await fetchRedemptions();
    return true;
  };

  useEffect(() => {
    fetchRedemptions();
  }, []);

  return { 
    redemptions, 
    pendingRedemption,
    isLoading, 
    createRedemption, 
    cancelRedemption,
    refetch: fetchRedemptions 
  };
};
