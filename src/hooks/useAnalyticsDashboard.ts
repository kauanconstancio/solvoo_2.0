import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface AnalyticsData {
  totalRevenue: number;
  totalFees: number;
  totalTransactions: number;
  averageTransactionValue: number;
  revenueByDay: { date: string; revenue: number; fees: number; count: number }[];
  topServices: { title: string; revenue: number; count: number }[];
  topProfessionals: { name: string; revenue: number; services: number }[];
  conversionMetrics: {
    totalViews: number;
    totalQuotes: number;
    completedQuotes: number;
    conversionRate: number;
  };
  userMetrics: {
    activeUsers: number;
    newUsers7d: number;
    newUsers30d: number;
    professionalRatio: number;
  };
}

export const useAnalyticsDashboard = (periodDays: number = 30) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const startDate = startOfDay(subDays(new Date(), periodDays));
      const endDate = endOfDay(new Date());

      // Fetch transactions
      const { data: transactions, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('type', 'credit')
        .eq('status', 'completed');

      if (txError) throw txError;

      // Fetch quotes with service info
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id, price, status, completed_at, professional_id,
          services:service_id (title)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (quotesError) throw quotesError;

      // Fetch service views
      const { data: views, error: viewsError } = await supabase
        .from('service_views')
        .select('id')
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString());

      if (viewsError) throw viewsError;

      // Fetch user metrics
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, account_type, status, created_at');

      if (profilesError) throw profilesError;

      // Fetch professional profiles for revenue calculation
      const { data: professionalProfiles, error: profError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('account_type', 'profissional');

      if (profError) throw profError;

      const profMap = new Map(professionalProfiles?.map(p => [p.user_id, p.full_name]) || []);

      // Calculate revenue by day
      const revenueByDayMap = new Map<string, { revenue: number; fees: number; count: number }>();
      
      for (let i = 0; i <= periodDays; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        revenueByDayMap.set(date, { revenue: 0, fees: 0, count: 0 });
      }

      (transactions || []).forEach(tx => {
        const date = format(new Date(tx.created_at), 'yyyy-MM-dd');
        const existing = revenueByDayMap.get(date) || { revenue: 0, fees: 0, count: 0 };
        revenueByDayMap.set(date, {
          revenue: existing.revenue + Number(tx.amount),
          fees: existing.fees + Number(tx.fee),
          count: existing.count + 1
        });
      });

      const revenueByDay = Array.from(revenueByDayMap.entries())
        .map(([date, data]) => ({ date: format(new Date(date), 'dd/MM'), ...data }))
        .reverse();

      // Calculate top services
      const serviceRevenueMap = new Map<string, { revenue: number; count: number }>();
      (quotes || []).filter(q => q.status === 'completed').forEach(quote => {
        const title = (quote.services as any)?.title || 'Serviço';
        const existing = serviceRevenueMap.get(title) || { revenue: 0, count: 0 };
        serviceRevenueMap.set(title, {
          revenue: existing.revenue + Number(quote.price),
          count: existing.count + 1
        });
      });

      const topServices = Array.from(serviceRevenueMap.entries())
        .map(([title, data]) => ({ title, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate top professionals
      const profRevenueMap = new Map<string, { revenue: number; services: number }>();
      (transactions || []).forEach(tx => {
        const name = profMap.get(tx.user_id) || 'Profissional';
        const existing = profRevenueMap.get(name) || { revenue: 0, services: 0 };
        profRevenueMap.set(name, {
          revenue: existing.revenue + Number(tx.net_amount),
          services: existing.services + 1
        });
      });

      const topProfessionals = Array.from(profRevenueMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate totals
      const totalRevenue = (transactions || []).reduce((sum, tx) => sum + Number(tx.amount), 0);
      const totalFees = (transactions || []).reduce((sum, tx) => sum + Number(tx.fee), 0);
      const totalTransactions = transactions?.length || 0;
      const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Conversion metrics
      const completedQuotes = (quotes || []).filter(q => q.status === 'completed').length;
      const totalQuotes = quotes?.length || 0;
      const totalViews = views?.length || 0;
      const conversionRate = totalViews > 0 ? (completedQuotes / totalViews) * 100 : 0;

      // User metrics
      const activeUsers = (allProfiles || []).filter(p => p.status === 'active').length;
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7);
      const thirtyDaysAgo = subDays(now, 30);
      
      const newUsers7d = (allProfiles || []).filter(p => 
        new Date(p.created_at) >= sevenDaysAgo
      ).length;
      
      const newUsers30d = (allProfiles || []).filter(p => 
        new Date(p.created_at) >= thirtyDaysAgo
      ).length;

      const professionals = (allProfiles || []).filter(p => p.account_type === 'profissional').length;
      const professionalRatio = allProfiles?.length ? (professionals / allProfiles.length) * 100 : 0;

      setData({
        totalRevenue,
        totalFees,
        totalTransactions,
        averageTransactionValue,
        revenueByDay,
        topServices,
        topProfessionals,
        conversionMetrics: {
          totalViews,
          totalQuotes,
          completedQuotes,
          conversionRate
        },
        userMetrics: {
          activeUsers,
          newUsers7d,
          newUsers30d,
          professionalRatio
        }
      });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [periodDays]);

  return { data, isLoading, error, refetch: fetchAnalytics };
};
