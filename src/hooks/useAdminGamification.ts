import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProfessionalLevel, ProfessionalBadge, ProfessionalGoal } from './useProfessionalGamification';

interface GamificationStats {
  totalProfessionalsWithStats: number;
  totalRevenue: number;
  totalServices: number;
  levelDistribution: Array<{ level: string; count: number; color: string }>;
  activeGoals: number;
  totalBadgesAwarded: number;
}

interface RankedProfessional {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_revenue: number;
  total_services: number;
  level_name: string;
  level_color: string;
}

const parseLevels = (data: any[]): ProfessionalLevel[] => {
  return data.map(level => ({
    ...level,
    benefits: Array.isArray(level.benefits) 
      ? level.benefits.map((b: any) => String(b)) 
      : []
  }));
};

export function useAdminGamification() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [levels, setLevels] = useState<ProfessionalLevel[]>([]);
  const [badges, setBadges] = useState<ProfessionalBadge[]>([]);
  const [goals, setGoals] = useState<ProfessionalGoal[]>([]);
  const [topProfessionals, setTopProfessionals] = useState<RankedProfessional[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    setIsLoading(true);

    const { data: levelsData } = await supabase
      .from('professional_levels')
      .select('*')
      .order('sort_order', { ascending: true });

    const parsedLevels = parseLevels(levelsData || []);
    setLevels(parsedLevels);

    const { data: badgesData } = await supabase
      .from('professional_badges')
      .select('*')
      .order('requirement_value', { ascending: true });

    setBadges(badgesData || []);

    const { data: goalsData } = await supabase
      .from('professional_goals')
      .select('*')
      .order('created_at', { ascending: false });

    setGoals(goalsData || []);

    const { data: statsData } = await supabase
      .from('professional_stats')
      .select('user_id, total_revenue, total_services, current_level_id');

    const { count: badgeAwardsCount } = await supabase
      .from('professional_badge_awards')
      .select('id', { count: 'exact', head: true });

    const levelCounts = new Map<string, number>();
    (statsData || []).forEach(s => {
      const levelId = s.current_level_id || 'none';
      levelCounts.set(levelId, (levelCounts.get(levelId) || 0) + 1);
    });

    const levelDistribution = parsedLevels.map(level => ({
      level: level.name,
      count: levelCounts.get(level.id) || 0,
      color: level.color
    }));

    const totalRevenue = (statsData || []).reduce((sum, s) => sum + Number(s.total_revenue || 0), 0);
    const totalServices = (statsData || []).reduce((sum, s) => sum + (s.total_services || 0), 0);

    setStats({
      totalProfessionalsWithStats: (statsData || []).length,
      totalRevenue,
      totalServices,
      levelDistribution,
      activeGoals: (goalsData || []).filter(g => g.is_active).length,
      totalBadgesAwarded: badgeAwardsCount || 0
    });

    const topStats = (statsData || [])
      .sort((a, b) => Number(b.total_revenue) - Number(a.total_revenue))
      .slice(0, 10);

    if (topStats.length > 0) {
      const userIds = topStats.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const levelsMap = new Map(parsedLevels.map(l => [l.id, l]));

      const ranked = topStats.map(s => {
        const profile = profilesMap.get(s.user_id);
        const level = levelsMap.get(s.current_level_id || '');
        return {
          user_id: s.user_id,
          full_name: profile?.full_name || 'Usuário',
          avatar_url: profile?.avatar_url || null,
          total_revenue: Number(s.total_revenue) || 0,
          total_services: s.total_services || 0,
          level_name: level?.name || 'Bronze',
          level_color: level?.color || '#CD7F32'
        };
      });

      setTopProfessionals(ranked);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateLevel = async (levelId: string, updates: Partial<ProfessionalLevel>) => {
    const { error } = await supabase
      .from('professional_levels')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', levelId);

    if (error) {
      toast.error('Erro ao atualizar nível');
      return false;
    }

    toast.success('Nível atualizado');
    await fetchAll();
    return true;
  };

  const createBadge = async (badge: Omit<ProfessionalBadge, 'id'>) => {
    const { error } = await supabase.from('professional_badges').insert(badge);
    if (error) {
      toast.error('Erro ao criar badge');
      return false;
    }
    toast.success('Badge criado');
    await fetchAll();
    return true;
  };

  const createGoal = async (goal: Omit<ProfessionalGoal, 'id'>) => {
    const { error } = await supabase.from('professional_goals').insert(goal);
    if (error) {
      toast.error('Erro ao criar meta');
      return false;
    }
    toast.success('Meta criada');
    await fetchAll();
    return true;
  };

  return {
    stats,
    levels,
    badges,
    goals,
    topProfessionals,
    isLoading,
    refetch: fetchAll,
    updateLevel,
    createBadge,
    createGoal
  };
}
