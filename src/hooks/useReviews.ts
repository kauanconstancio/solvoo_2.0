import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  service_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ServiceRating {
  service_id: string;
  average_rating: number;
  review_count: number;
}

export interface ProviderRating {
  average_rating: number;
  total_reviews: number;
}

export const useReviews = (serviceId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [serviceRating, setServiceRating] = useState<ServiceRating | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    if (!serviceId) return;

    setIsLoading(true);
    try {
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        setServiceRating(null);
        setIsLoading(false);
        return;
      }

      // Fetch profiles for each reviewer
      const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      const reviewsWithProfiles: Review[] = reviewsData.map((r) => ({
        ...r,
        profile: profilesMap.get(r.user_id) || null,
      }));

      setReviews(reviewsWithProfiles);

      // Calculate rating
      const totalRating = reviewsData.reduce((sum, r) => sum + r.rating, 0);
      setServiceRating({
        service_id: serviceId,
        average_rating: Math.round((totalRating / reviewsData.length) * 10) / 10,
        review_count: reviewsData.length,
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const addReview = async (rating: number, comment: string, images: string[] = []) => {
    if (!serviceId) return { error: "Service ID is required" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para avaliar",
        variant: "destructive",
      });
      return { error: "Not authenticated" };
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        service_id: serviceId,
        user_id: user.id,
        rating,
        comment: comment || null,
        images: images.length > 0 ? images : null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Erro",
            description: "Você já avaliou este serviço",
            variant: "destructive",
          });
          return { error: "Already reviewed" };
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Avaliação enviada com sucesso!",
      });

      await fetchReviews();
      return { error: null };
    } catch (error: any) {
      console.error("Error adding review:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a avaliação",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  return {
    reviews,
    serviceRating,
    isLoading,
    addReview,
    refetchReviews: fetchReviews,
  };
};

// Hook to get provider's average rating across all services
export const useProviderRating = (userId: string | null) => {
  const [providerRating, setProviderRating] = useState<ProviderRating | null>(null);
  const [serviceRatings, setServiceRatings] = useState<(ServiceRating & { title: string })[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProviderRating = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Get all services from this provider
      const { data: services } = await supabase
        .from("services")
        .select("id, title")
        .eq("user_id", userId)
        .eq("status", "active");

      if (!services || services.length === 0) {
        setProviderRating(null);
        setServiceRatings([]);
        setAllReviews([]);
        setIsLoading(false);
        return;
      }

      const serviceIds = services.map((s) => s.id);

      // Get all reviews for these services
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .in("service_id", serviceIds)
        .order("created_at", { ascending: false });

      if (!reviewsData || reviewsData.length === 0) {
        setProviderRating(null);
        setServiceRatings([]);
        setAllReviews([]);
        setIsLoading(false);
        return;
      }

      // Fetch profiles for each reviewer
      const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      const reviewsWithProfiles: Review[] = reviewsData.map((r) => ({
        ...r,
        profile: profilesMap.get(r.user_id) || null,
      }));

      setAllReviews(reviewsWithProfiles);

      // Calculate per-service ratings
      const ratingsMap: Record<string, { total: number; count: number; title: string }> = {};
      services.forEach((s) => {
        ratingsMap[s.id] = { total: 0, count: 0, title: s.title };
      });

      reviewsData.forEach((r) => {
        if (ratingsMap[r.service_id]) {
          ratingsMap[r.service_id].total += r.rating;
          ratingsMap[r.service_id].count += 1;
        }
      });

      const serviceRatingsArray = Object.entries(ratingsMap)
        .filter(([_, data]) => data.count > 0)
        .map(([serviceId, data]) => ({
          service_id: serviceId,
          title: data.title,
          average_rating: Math.round((data.total / data.count) * 10) / 10,
          review_count: data.count,
        }));

      setServiceRatings(serviceRatingsArray);

      // Calculate overall provider rating
      const totalRating = reviewsData.reduce((sum, r) => sum + r.rating, 0);
      setProviderRating({
        average_rating: Math.round((totalRating / reviewsData.length) * 10) / 10,
        total_reviews: reviewsData.length,
      });
    } catch (error) {
      console.error("Error fetching provider rating:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProviderRating();
  }, [fetchProviderRating]);

  return { providerRating, serviceRatings, allReviews, isLoading, refetchProviderRating: fetchProviderRating };
};

// Hook to get ratings for multiple services
export const useServicesRatings = (serviceIds: string[]) => {
  const [ratingsMap, setRatingsMap] = useState<Record<string, ServiceRating>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!serviceIds.length) return;

      setIsLoading(true);
      try {
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("service_id, rating")
          .in("service_id", serviceIds);

        if (!reviewsData || reviewsData.length === 0) {
          setRatingsMap({});
          setIsLoading(false);
          return;
        }

        // Group reviews by service_id and calculate averages
        const grouped: Record<string, { total: number; count: number }> = {};
        reviewsData.forEach((r) => {
          if (!grouped[r.service_id]) {
            grouped[r.service_id] = { total: 0, count: 0 };
          }
          grouped[r.service_id].total += r.rating;
          grouped[r.service_id].count += 1;
        });

        const ratings: Record<string, ServiceRating> = {};
        Object.entries(grouped).forEach(([serviceId, data]) => {
          ratings[serviceId] = {
            service_id: serviceId,
            average_rating: Math.round((data.total / data.count) * 10) / 10,
            review_count: data.count,
          };
        });

        setRatingsMap(ratings);
      } catch (error) {
        console.error("Error fetching services ratings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [serviceIds.join(",")]);

  return { ratingsMap, isLoading };
};
