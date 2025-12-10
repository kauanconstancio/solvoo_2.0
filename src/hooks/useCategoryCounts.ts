import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CategoryCount {
  category: string;
  count: number;
}

export const useCategoryCounts = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("category")
          .eq("status", "active");

        if (error) {
          console.error("Error fetching category counts:", error);
          return;
        }

        // Count services per category
        const countMap: Record<string, number> = {};
        data?.forEach((service) => {
          const cat = service.category;
          countMap[cat] = (countMap[cat] || 0) + 1;
        });

        setCounts(countMap);
      } catch (error) {
        console.error("Error fetching category counts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return { counts, isLoading };
};
