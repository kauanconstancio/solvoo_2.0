import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

interface ServiceSuggestion {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  city: string;
  state: string;
  price: string;
  image: string | null;
}

export const useServiceAutocomplete = (query: string, isOpen: boolean) => {
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !isOpen) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id, title, category, subcategory, city, state, price, images")
          .eq("status", "active")
          .ilike("title", `%${debouncedQuery}%`)
          .order("views_count", { ascending: false })
          .limit(6);

        if (error) throw error;

        const formattedSuggestions: ServiceSuggestion[] = (data || []).map((service) => ({
          id: service.id,
          title: service.title,
          category: service.category,
          subcategory: service.subcategory,
          city: service.city,
          state: service.state,
          price: service.price,
          image: service.images?.[0] || null,
        }));

        setSuggestions(formattedSuggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, isOpen]);

  return { suggestions, isLoading };
};
