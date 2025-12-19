import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceMetrics {
  id: string;
  title: string;
  category: string;
  views_count: number;
  favorites_count: number;
  conversations_count: number;
  completed_services_count: number;
  reviews_count: number;
  average_rating: number;
  created_at: string;
  status: string;
  images: string[] | null;
}

export interface DashboardMetrics {
  total_views: number;
  total_favorites: number;
  total_conversations: number;
  total_completed_services: number;
  total_reviews: number;
  average_rating: number;
  total_services: number;
  active_services: number;
  views_trend: { date: string; views: number }[];
  top_services: ServiceMetrics[];
  recent_conversations: number;
}

export const useProfessionalMetrics = (periodDays: number = 7) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Fetch all services for the professional
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id);

      if (servicesError) throw servicesError;

      if (!services || services.length === 0) {
        setMetrics({
          total_views: 0,
          total_favorites: 0,
          total_conversations: 0,
          total_completed_services: 0,
          total_reviews: 0,
          average_rating: 0,
          total_services: 0,
          active_services: 0,
          views_trend: [],
          top_services: [],
          recent_conversations: 0,
        });
        setServiceMetrics([]);
        setIsLoading(false);
        return;
      }

      const serviceIds = services.map(s => s.id);

      // Fetch conversations count
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, service_id, created_at, last_message_at')
        .eq('professional_id', user.id);

      // Fetch completed quotes (services realized)
      const { data: completedQuotes } = await supabase
        .from('quotes')
        .select('id, service_id, professional_id, client_confirmed')
        .eq('professional_id', user.id)
        .eq('status', 'accepted')
        .eq('client_confirmed', true);

      // Fetch recent conversations based on period (using last_message_at for accurate recent activity)
      const periodAgo = new Date();
      periodAgo.setDate(periodAgo.getDate() - periodDays);
      const recentConversations = conversations?.filter(
        c => new Date(c.last_message_at) >= periodAgo
      ).length || 0;

      // Fetch real views data from analytics table based on period
      const { data: viewsData } = await supabase
        .from('service_views')
        .select('service_id, viewed_at')
        .in('service_id', serviceIds)
        .gte('viewed_at', periodAgo.toISOString());

      // Fetch reviews for all services
      const { data: reviews } = await supabase
        .from('reviews')
        .select('service_id, rating')
        .in('service_id', serviceIds);

      // Calculate metrics per service - favorites_count now comes directly from the service
      const enrichedServices: ServiceMetrics[] = services.map(service => {
        const serviceConversations = conversations?.filter(c => c.service_id === service.id).length || 0;
        const serviceCompletedServices = completedQuotes?.filter(q => q.service_id === service.id).length || 0;
        const serviceReviews = reviews?.filter(r => r.service_id === service.id) || [];
        const avgRating = serviceReviews.length > 0
          ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
          : 0;

        return {
          id: service.id,
          title: service.title,
          category: service.category,
          views_count: service.views_count || 0,
          favorites_count: (service as any).favorites_count || 0,
          conversations_count: serviceConversations,
          completed_services_count: serviceCompletedServices,
          reviews_count: serviceReviews.length,
          average_rating: Math.round(avgRating * 10) / 10,
          created_at: service.created_at,
          status: service.status,
          images: service.images,
        };
      });

      // Calculate totals
      const totalViews = enrichedServices.reduce((sum, s) => sum + s.views_count, 0);
      const totalFavorites = enrichedServices.reduce((sum, s) => sum + s.favorites_count, 0);
      const totalConversations = conversations?.length || 0;
      const totalCompletedServices = completedQuotes?.length || 0;
      const totalReviews = reviews?.length || 0;
      const overallRating = totalReviews > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      // Sort by views for top services
      const topServices = [...enrichedServices]
        .sort((a, b) => b.views_count - a.views_count)
        .slice(0, 5);

      // Generate views trend from real analytics data
      const viewsTrend = generateViewsTrend(viewsData || [], periodDays);

      setMetrics({
        total_views: totalViews,
        total_favorites: totalFavorites,
        total_conversations: totalConversations,
        total_completed_services: totalCompletedServices,
        total_reviews: totalReviews,
        average_rating: Math.round(overallRating * 10) / 10,
        total_services: services.length,
        active_services: services.filter(s => s.status === 'active').length,
        views_trend: viewsTrend,
        top_services: topServices,
        recent_conversations: recentConversations,
      });

      setServiceMetrics(enrichedServices);

    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError('Erro ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Subscribe to realtime updates for metrics
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Dashboard Realtime] No user found, skipping subscriptions');
        return;
      }

      console.log('[Dashboard Realtime] Setting up subscriptions for user:', user.id);

      // Subscribe to conversations changes (new contacts)
      const conversationsChannel = supabase
        .channel('dashboard-conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `professional_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[Dashboard Realtime] Conversation change:', payload);
            fetchMetrics();
          }
        )
        .subscribe((status) => {
          console.log('[Dashboard Realtime] Conversations channel status:', status);
        });

      // Subscribe to service_views changes (new views)
      const viewsChannel = supabase
        .channel('dashboard-views')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_views',
          },
          (payload) => {
            console.log('[Dashboard Realtime] View change:', payload);
            fetchMetrics();
          }
        )
        .subscribe((status) => {
          console.log('[Dashboard Realtime] Views channel status:', status);
        });

      // Subscribe to reviews changes
      const reviewsChannel = supabase
        .channel('dashboard-reviews')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reviews',
          },
          (payload) => {
            console.log('[Dashboard Realtime] Review change:', payload);
            fetchMetrics();
          }
        )
        .subscribe((status) => {
          console.log('[Dashboard Realtime] Reviews channel status:', status);
        });

      // Subscribe to favorites changes
      const favoritesChannel = supabase
        .channel('dashboard-favorites')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorites',
          },
          (payload) => {
            console.log('[Dashboard Realtime] Favorites change:', payload);
            fetchMetrics();
          }
        )
        .subscribe((status) => {
          console.log('[Dashboard Realtime] Favorites channel status:', status);
        });

      // Subscribe to services changes (status, etc)
      const servicesChannel = supabase
        .channel('dashboard-services')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'services',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[Dashboard Realtime] Service change:', payload);
            fetchMetrics();
          }
        )
        .subscribe((status) => {
          console.log('[Dashboard Realtime] Services channel status:', status);
        });

      return () => {
        console.log('[Dashboard Realtime] Cleaning up subscriptions');
        supabase.removeChannel(conversationsChannel);
        supabase.removeChannel(viewsChannel);
        supabase.removeChannel(reviewsChannel);
        supabase.removeChannel(favoritesChannel);
        supabase.removeChannel(servicesChannel);
      };
    };

    const cleanup = setupRealtimeSubscriptions();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [fetchMetrics]);

  return { metrics, serviceMetrics, isLoading, error, refetch: fetchMetrics };
};

// Use a fixed timezone for analytics labels (Brazil)
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

function getDateKeyInTimeZone(date: Date, timeZone: string = BRAZIL_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const month = parts.find((p) => p.type === 'month')?.value ?? '00';
  const day = parts.find((p) => p.type === 'day')?.value ?? '00';

  return `${year}-${month}-${day}`;
}

function formatDayMonthInTimeZone(date: Date, timeZone: string = BRAZIL_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
  }).formatToParts(date);

  const day = parts.find((p) => p.type === 'day')?.value ?? '00';
  const month = parts.find((p) => p.type === 'month')?.value ?? '00';

  return `${parseInt(day, 10)}/${parseInt(month, 10)}`;
}

// Helper function to generate trend data from real analytics
function generateViewsTrend(
  viewsData: { service_id: string; viewed_at: string }[],
  periodDays: number
): { date: string; views: number }[] {
  const trend: { date: string; views: number }[] = [];
  const now = new Date();

  // Create a map to count views per day (in Brazil timezone)
  const viewsByDay: Record<string, number> = {};

  // Initialize days with 0
  for (let i = periodDays - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = getDateKeyInTimeZone(date);
    viewsByDay[dateKey] = 0;
  }

  // Count actual views per day
  viewsData.forEach((view) => {
    const dateKey = getDateKeyInTimeZone(new Date(view.viewed_at));
    if (viewsByDay[dateKey] !== undefined) {
      viewsByDay[dateKey]++;
    }
  });

  // Convert to trend array
  for (let i = periodDays - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = getDateKeyInTimeZone(date);

    trend.push({
      date: formatDayMonthInTimeZone(date),
      views: viewsByDay[dateKey] || 0,
    });
  }

  return trend;
}

