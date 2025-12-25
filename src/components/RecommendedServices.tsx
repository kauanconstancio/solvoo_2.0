import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import ServiceCard from "./ServiceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useServicesRatings } from "@/hooks/useReviews";
import { supabase } from "@/integrations/supabase/client";

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

  const getLocation = (city: string, state: string) => {
    return `${city}, ${state.toUpperCase()}`;
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
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
        <div className="flex items-center gap-3 mb-8 md:mb-12">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {recommendations.map((service) => {
            const serviceRating = ratingsMap[service.id];
            const providerName = providers[service.user_id] || null;
            
            return (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                provider={providerName || undefined}
                location={getLocation(service.city, service.state)}
                price={service.price}
                image={service.images?.[0]}
                category={service.category}
                subcategory={service.subcategory}
                verified={service.verified}
                providerName={providerName}
                rating={serviceRating?.average_rating}
                reviewCount={serviceRating?.review_count}
                slug={(service as any).slug || null}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecommendedServices;
