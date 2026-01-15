import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProfessionalLevel {
  id: string;
  name: string;
  slug: string;
  min_revenue: number;
  min_services: number;
  icon_url: string | null;
  color: string;
  benefits: string[];
  commission_discount: number;
  priority_boost: number;
  sort_order: number;
}

export interface ProfessionalStats {
  id: string;
  user_id: string;
  total_revenue: number;
  total_services: number;
  current_level_id: string | null;
  current_month_revenue: number;
  current_month_services: number;
  best_month_revenue: number;
  streak_months: number;
  current_level?: ProfessionalLevel;
}

export interface ProfessionalBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
}

export interface BadgeAward {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: ProfessionalBadge;
}

export interface ProfessionalGoal {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  target_value: number;
  reward_type: string | null;
  reward_value: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface GoalProgress {
  id: string;
  user_id: string;
  goal_id: string;
  current_value: number;
  completed_at: string | null;
  reward_claimed_at: string | null;
  goal?: ProfessionalGoal;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  data: Record<string, any> | null;
  created_at: string;
}

const parseLevels = (data: any[]): ProfessionalLevel[] => {
  return data.map(level => ({
    ...level,
    benefits: Array.isArray(level.benefits) 
      ? level.benefits.map((b: any) => String(b)) 
      : []
  }));
};

export function useProfessionalLevels() {
  const [levels, setLevels] = useState<ProfessionalLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLevels = async () => {
      const { data, error } = await supabase
        .from('professional_levels')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setLevels(parseLevels(data));
      }
      setIsLoading(false);
    };

    fetchLevels();
  }, []);

  return { levels, isLoading };
}

export function useProfessionalStats() {
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [nextLevel, setNextLevel] = useState<ProfessionalLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Fetch levels first
    const { data: levelsData } = await supabase
      .from('professional_levels')
      .select('*')
      .order('sort_order', { ascending: true });

    const levels = parseLevels(levelsData || []);

    // Fetch stats
    const { data: statsData } = await supabase
      .from('professional_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsData) {
      const currentLevel = levels.find(l => l.id === statsData.current_level_id);
      setStats({
        ...statsData,
        current_level: currentLevel
      });

      // Find next level
      if (currentLevel) {
        const nextLevelData = levels.find(l => l.sort_order > currentLevel.sort_order);
        setNextLevel(nextLevelData || null);
      } else if (levels.length > 0) {
        // No current level, set first level as target
        setStats(prev => prev ? { ...prev, current_level: levels[0] } : null);
        setNextLevel(levels.length > 1 ? levels[1] : null);
      }
    } else {
      // Create default stats entry with first level
      const firstLevel = levels[0];
      if (firstLevel) {
        const { data: newStats } = await supabase
          .from('professional_stats')
          .insert({
            user_id: user.id,
            current_level_id: firstLevel.id
          })
          .select()
          .single();

        if (newStats) {
          setStats({
            ...newStats,
            current_level: firstLevel
          });
          setNextLevel(levels.length > 1 ? levels[1] : null);
        }
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, nextLevel, isLoading, refetch: fetchStats };
}

export function useProfessionalBadges() {
  const [earnedBadges, setEarnedBadges] = useState<BadgeAward[]>([]);
  const [availableBadges, setAvailableBadges] = useState<ProfessionalBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch all active badges
      const { data: allBadges } = await supabase
        .from('professional_badges')
        .select('*')
        .eq('is_active', true);

      // Fetch earned badges
      const { data: awards } = await supabase
        .from('professional_badge_awards')
        .select('*, badge:badge_id(*)')
        .eq('user_id', user.id);

      const earnedIds = new Set((awards || []).map(a => a.badge_id));
      
      setEarnedBadges((awards || []).map(a => ({
        ...a,
        badge: a.badge as unknown as ProfessionalBadge
      })));
      
      setAvailableBadges((allBadges || []).filter(b => !earnedIds.has(b.id)));
      setIsLoading(false);
    };

    fetchBadges();
  }, []);

  return { earnedBadges, availableBadges, isLoading };
}

export function useProfessionalGoals() {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch active goals
      const { data: activeGoals } = await supabase
        .from('professional_goals')
        .select('*')
        .eq('is_active', true);

      // Fetch progress
      const { data: progress } = await supabase
        .from('professional_goal_progress')
        .select('*, goal:goal_id(*)')
        .eq('user_id', user.id);

      // Combine goals with progress
      const goalsWithProgress = (activeGoals || []).map(goal => {
        const existingProgress = (progress || []).find(p => p.goal_id === goal.id);
        return existingProgress ? {
          ...existingProgress,
          goal
        } : {
          id: '',
          user_id: user.id,
          goal_id: goal.id,
          current_value: 0,
          completed_at: null,
          reward_claimed_at: null,
          goal
        };
      });

      setGoals(goalsWithProgress as GoalProgress[]);
      setIsLoading(false);
    };

    fetchGoals();
  }, []);

  return { goals, isLoading };
}

export function useProfessionalAchievements(limit = 10) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('professional_achievements_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      setAchievements((data || []) as Achievement[]);
      setIsLoading(false);
    };

    fetchAchievements();
  }, [limit]);

  return { achievements, isLoading };
}

export function useProfessionalRanking(limit = 10) {
  const [ranking, setRanking] = useState<Array<{
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    total_revenue: number;
    total_services: number;
    level_name: string;
    level_color: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data: stats } = await supabase
        .from('professional_stats')
        .select('user_id, total_revenue, total_services, current_level_id')
        .order('total_revenue', { ascending: false })
        .limit(limit);

      if (!stats || stats.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch profiles for these users
      const userIds = stats.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Fetch levels
      const { data: levels } = await supabase
        .from('professional_levels')
        .select('id, name, color');

      const levelsMap = new Map((levels || []).map(l => [l.id, l]));
      const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const rankingData = stats.map(s => {
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

      setRanking(rankingData);
      setIsLoading(false);
    };

    fetchRanking();
  }, [limit]);

  return { ranking, isLoading };
}
