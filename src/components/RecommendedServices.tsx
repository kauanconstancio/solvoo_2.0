import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import ServiceCardCompact from "./ServiceCardCompact";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useServicesRatings } from "@/hooks/useReviews";
import { supabase } from "@/integrations/supabase/client";
import { AnimateOnScroll } from "./AnimateOnScroll";

interface ProviderInfo {
  [userId: string]: string | null;
}

const RecommendedServices = () => {
  const { recommendations, reason, isLoading } = useRecommendations();
  const [providers, setProviders] = useState<ProviderInfo>({});
  
  const serviceIds = useMemo(() => recommendations.map((s) => s.id), [recommendations]);
  const { ratingsMap } = useServicesRatings(serviceIds);

  useEffect(() => {
    const fetchProviders = async () => {
      if (recommendations.length === 0) return;
      
      const userIds = [...new Set(recommendations.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      if (profiles) {
        const providerMap: ProviderInfo = {};
        profiles.forEach(p => {
          providerMap[p.user_id] = p.full_name;
        });
        setProviders(providerMap);
      }
    };

    fetchProviders();
  }, [recommendations]);


  if (isLoading) {
    return (
      <section className="py-12 md:py-16">
        <div className="container px-4">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold">
                Recomendados para Você
              </h2>
              <Skeleton className="h-4 w-48 mt-1" />
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-[160px] sm:w-[180px] flex-shrink-0 space-y-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <AnimateOnScroll animation="fade-up" className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold">
              Recomendados para Você
            </h2>
            {reason && (
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                {reason}
              </p>
            )}
          </div>
        </AnimateOnScroll>

        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {recommendations.map((service, index) => {
            const serviceRating = ratingsMap[service.id];
            const providerName = providers[service.user_id] || null;
            
            return (
              <AnimateOnScroll
                key={service.id}
                animation="fade-up"
                delay={index * 30}
                duration={300}
                className="flex-shrink-0"
              >
                <ServiceCardCompact
                  id={service.id}
                  title={service.title}
                  price={service.price}
                  image={service.images?.[0]}
                  category={service.category}
                  subcategory={service.subcategory}
                  providerName={providerName}
                  rating={serviceRating?.average_rating}
                  reviewCount={serviceRating?.review_count}
                  slug={(service as any).slug || null}
                />
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecommendedServices;
