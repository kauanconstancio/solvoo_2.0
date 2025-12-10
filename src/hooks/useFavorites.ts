import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FavoriteData {
  service_id: string;
  service_title: string;
  service_category: string | null;
  service_subcategory: string | null;
  service_image: string | null;
  service_price: string | null;
  service_provider: string | null;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user favorites on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      setUserId(session.user.id);

      try {
        const { data, error } = await supabase
          .from("favorites")
          .select("service_id")
          .eq("user_id", session.user.id);

        if (error) throw error;

        setFavorites(data?.map((f) => f.service_id) || []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
        fetchFavorites();
      } else {
        setUserId(null);
        setFavorites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isFavorite = useCallback((serviceId: string) => {
    return favorites.includes(serviceId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (data: FavoriteData) => {
    if (!userId) {
      toast.error("Você precisa estar logado para salvar favoritos");
      return false;
    }

    const isCurrentlyFavorite = favorites.includes(data.service_id);

    try {
      if (isCurrentlyFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("service_id", data.service_id);

        if (error) throw error;

        setFavorites((prev) => prev.filter((id) => id !== data.service_id));
        toast.success("Removido dos favoritos");
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: userId,
            service_id: data.service_id,
            service_title: data.service_title,
            service_category: data.service_category,
            service_subcategory: data.service_subcategory,
            service_image: data.service_image,
            service_price: data.service_price,
            service_provider: data.service_provider,
          });

        if (error) throw error;

        setFavorites((prev) => [...prev, data.service_id]);
        toast.success("Adicionado aos favoritos");
      }

      return true;
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast.error("Erro ao atualizar favoritos");
      return false;
    }
  }, [userId, favorites]);

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    isAuthenticated: !!userId,
  };
};
