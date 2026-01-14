import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminLoyaltyStats {
  totalPointsDistributed: number;
  totalPointsRedeemed: number;
  totalUsersWithPoints: number;
  totalActiveRedemptions: number;
  totalDiscountValue: number;
}

interface LoyaltyConfig {
  id: string;
  points_per_real: number;
  min_points_redemption: number;
  point_value_in_reais: number;
  is_active: boolean;
}

interface TopUser {
  user_id: string;
  total_points: number;
  lifetime_points: number;
  profile?: {
    full_name: string | null;
    email?: string;
  };
}

export const useAdminLoyalty = () => {
  const [stats, setStats] = useState<AdminLoyaltyStats | null>(null);
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Get config
      const { data: configData } = await supabase
        .from('loyalty_config')
        .select('*')
        .single();

      if (configData) {
        setConfig(configData as unknown as LoyaltyConfig);
      }

      // Get all user points
      const { data: pointsData } = await supabase
        .from('user_loyalty_points')
        .select('*');

      const totalPointsDistributed = pointsData?.reduce((acc, p) => acc + (p.lifetime_points || 0), 0) || 0;
      const totalPointsRedeemed = pointsData?.reduce((acc, p) => acc + ((p.lifetime_points || 0) - (p.total_points || 0)), 0) || 0;
      const totalUsersWithPoints = pointsData?.length || 0;

      // Get active redemptions
      const { data: redemptionsData } = await supabase
        .from('loyalty_redemptions')
        .select('*')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      const totalActiveRedemptions = redemptionsData?.length || 0;
      const totalDiscountValue = redemptionsData?.reduce((acc, r) => acc + Number(r.discount_value || 0), 0) || 0;

      setStats({
        totalPointsDistributed,
        totalPointsRedeemed,
        totalUsersWithPoints,
        totalActiveRedemptions,
        totalDiscountValue
      });

      // Get top users
      const { data: topUsersData } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .order('lifetime_points', { ascending: false })
        .limit(10);

      if (topUsersData) {
        // Fetch profiles for top users
        const userIds = topUsersData.map(u => u.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const usersWithProfiles = topUsersData.map(u => ({
          ...u,
          profile: profilesData?.find(p => p.user_id === u.user_id) || null
        }));

        setTopUsers(usersWithProfiles as unknown as TopUser[]);
      }

    } catch (error) {
      console.error('Error fetching loyalty stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<LoyaltyConfig>) => {
    if (!config) return false;

    const { error } = await supabase
      .from('loyalty_config')
      .update(updates)
      .eq('id', config.id);

    if (error) {
      toast({
        title: 'Erro ao atualizar configuração',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'Configuração atualizada',
      description: 'As alterações foram salvas com sucesso'
    });

    await fetchStats();
    return true;
  };

  const addBonusPoints = async (userId: string, points: number, description: string) => {
    try {
      // Update user points
      const { data: existingPoints } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingPoints) {
        await supabase
          .from('user_loyalty_points')
          .update({
            total_points: (existingPoints.total_points || 0) + points,
            lifetime_points: (existingPoints.lifetime_points || 0) + points,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_loyalty_points')
          .insert({
            user_id: userId,
            total_points: points,
            lifetime_points: points
          });
      }

      // Record transaction
      await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: userId,
          points,
          type: 'bonus',
          description
        });

      toast({
        title: 'Pontos adicionados',
        description: `${points} pontos de bônus adicionados com sucesso`
      });

      await fetchStats();
      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar pontos',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    config,
    topUsers,
    isLoading,
    updateConfig,
    addBonusPoints,
    refetch: fetchStats
  };
};
