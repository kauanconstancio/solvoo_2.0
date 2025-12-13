import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceMetrics {
  id: string;
  title: string;
  category: string;
  views_count: number;
  favorites_count: number;
  conversations_count: number;
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
  total_reviews: number;
  average_rating: number;
  total_services: number;
  active_services: number;
  views_trend: { date: string; views: number }[];
  top_services: ServiceMetrics[];
  recent_conversations: number;
}

export const useProfessionalMetrics = () => {
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
        .select('id, service_id, created_at')
        .eq('professional_id', user.id);

      // Fetch recent conversations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentConversations = conversations?.filter(
        c => new Date(c.created_at) >= sevenDaysAgo
      ).length || 0;

      // Fetch reviews for all services
      const { data: reviews } = await supabase
        .from('reviews')
        .select('service_id, rating')
        .in('service_id', serviceIds);

      // Calculate metrics per service - favorites_count now comes directly from the service
      const enrichedServices: ServiceMetrics[] = services.map(service => {
        const serviceConversations = conversations?.filter(c => c.service_id === service.id).length || 0;
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
      const totalReviews = reviews?.length || 0;
      const overallRating = totalReviews > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      // Sort by views for top services
      const topServices = [...enrichedServices]
        .sort((a, b) => b.views_count - a.views_count)
        .slice(0, 5);

      // Generate views trend (simulated based on total views distributed over 7 days)
      const viewsTrend = generateViewsTrend(totalViews);

      setMetrics({
        total_views: totalViews,
        total_favorites: totalFavorites,
        total_conversations: totalConversations,
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
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, serviceMetrics, isLoading, error, refetch: fetchMetrics };
};

// Helper function to generate simulated trend data
function generateViewsTrend(totalViews: number): { date: string; views: number }[] {
  const trend: { date: string; views: number }[] = [];
  const today = new Date();
  
  // Distribute views somewhat randomly over the last 7 days
  const weights = [0.08, 0.1, 0.12, 0.14, 0.16, 0.18, 0.22];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayViews = Math.floor(totalViews * weights[6 - i]);
    
    trend.push({
      date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
      views: dayViews,
    });
  }
  
  return trend;
}
