import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecommendedService {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  price: string;
  price_type: string;
  city: string;
  state: string;
  images: string[];
  verified: boolean;
  user_id: string;
}

interface RecommendationsResult {
  recommendations: RecommendedService[];
  reason: string;
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendedService[]>([]);
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recommendations`,
          {
            method: "POST",
            headers,
          }
        );

        if (response.ok) {
          const data: RecommendationsResult = await response.json();
          setRecommendations(data.recommendations || []);
          setReason(data.reason || "");
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return { recommendations, reason, isLoading };
}
