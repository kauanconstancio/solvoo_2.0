import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminMetrics {
  totalUsers: number;
  totalProfessionals: number;
  totalClients: number;
  totalServices: number;
  activeServices: number;
  pausedServices: number;
  totalReviews: number;
  pendingReports: number;
  totalConversations: number;
  newUsersToday: number;
  newServicesToday: number;
}

interface UserGrowth {
  date: string;
  count: number;
}

export const useAdminMetrics = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('account_type, created_at');
      
      if (profilesError) throw profilesError;

      // Fetch all services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('status, created_at');
      
      if (servicesError) throw servicesError;

      // Fetch reviews count
      const { count: reviewsCount, error: reviewsError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });
      
      if (reviewsError) throw reviewsError;

      // Fetch pending reports
      const { count: pendingReports, error: reportsError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (reportsError) throw reportsError;

      // Fetch conversations count
      const { count: conversationsCount, error: conversationsError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });
      
      if (conversationsError) throw conversationsError;

      const today = new Date().toISOString().split('T')[0];
      
      const totalUsers = profiles?.length || 0;
      const totalProfessionals = profiles?.filter(p => p.account_type === 'profissional').length || 0;
      const totalClients = profiles?.filter(p => p.account_type === 'cliente').length || 0;
      const totalServices = services?.length || 0;
      const activeServices = services?.filter(s => s.status === 'active').length || 0;
      const pausedServices = services?.filter(s => s.status === 'paused').length || 0;
      const newUsersToday = profiles?.filter(p => p.created_at?.startsWith(today)).length || 0;
      const newServicesToday = services?.filter(s => s.created_at?.startsWith(today)).length || 0;

      setMetrics({
        totalUsers,
        totalProfessionals,
        totalClients,
        totalServices,
        activeServices,
        pausedServices,
        totalReviews: reviewsCount || 0,
        pendingReports: pendingReports || 0,
        totalConversations: conversationsCount || 0,
        newUsersToday,
        newServicesToday,
      });

      // Calculate user growth for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const growthData: { [key: string]: number } = {};
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        growthData[dateStr] = 0;
      }

      profiles?.forEach(profile => {
        const dateStr = profile.created_at?.split('T')[0];
        if (dateStr && growthData[dateStr] !== undefined) {
          growthData[dateStr]++;
        }
      });

      setUserGrowth(
        Object.entries(growthData).map(([date, count]) => ({
          date,
          count,
        }))
      );

    } catch (err) {
      console.error('Error fetching admin metrics:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    userGrowth,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
};
