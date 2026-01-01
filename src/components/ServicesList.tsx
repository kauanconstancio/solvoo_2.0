import { useEffect, useState, useMemo } from "react";
import ServiceCardCompact from "./ServiceCardCompact";
import HorizontalScrollSection from "./HorizontalScrollSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { serviceCategories } from "@/data/services";
import { AnimateOnScroll } from "./AnimateOnScroll";
import { useServicesRatings } from "@/hooks/useReviews";
interface Service {
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
  provider_name: string | null;
  slug: string | null;
}

const ServicesList = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const serviceIds = useMemo(() => services.map((s) => s.id), [services]);
  const { ratingsMap } = useServicesRatings(serviceIds);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const { data: servicesData, error } = await supabase
          .from("services")
          .select("id, title, category, subcategory, price, price_type, city, state, images, verified, user_id, slug")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) throw error;

        // Fetch profiles for each service
        const servicesWithProfiles: Service[] = await Promise.all(
          (servicesData || []).map(async (service) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", service.user_id)
              .maybeSingle();
            
            return {
              id: service.id,
              title: service.title,
              category: service.category,
              subcategory: service.subcategory || null,
              price: service.price,
              price_type: service.price_type,
              city: service.city,
              state: service.state,
              images: service.images || [],
              verified: service.verified,
              provider_name: profileData?.full_name || null,
              slug: (service as any).slug || null,
            };
          })
        );

        setServices(servicesWithProfiles);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = selectedCategory === "all" 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1 md:mb-2">
                Serviços em Destaque
              </h2>
              <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                Profissionais avaliados e verificados
              </p>
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

  if (services.length === 0) {
    return (
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1 md:mb-2">
                Serviços em Destaque
              </h2>
              <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                Profissionais avaliados e verificados
              </p>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Nenhum serviço disponível no momento.
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Seja o primeiro a anunciar seu serviço!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container px-4">
        <AnimateOnScroll animation="fade-up" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1 md:mb-2">
              Serviços em Destaque
            </h2>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
              Profissionais avaliados e verificados
            </p>
          </div>
        </AnimateOnScroll>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <AnimateOnScroll animation="fade-up" delay={100}>
            <TabsList className="w-full sm:w-auto mb-6 flex-wrap h-auto">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {serviceCategories.slice(0, 8).map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </AnimateOnScroll>

          <TabsContent value={selectedCategory} className="mt-0">
            {filteredServices.length > 0 ? (
              <HorizontalScrollSection>
                {filteredServices.map((service, index) => {
                  const serviceRating = ratingsMap[service.id];
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
                        priceType={service.price_type}
                        image={service.images?.[0]}
                        category={service.category}
                        subcategory={service.subcategory}
                        providerName={service.provider_name}
                        slug={service.slug}
                        rating={serviceRating?.average_rating}
                        reviewCount={serviceRating?.review_count}
                      />
                    </AnimateOnScroll>
                  );
                })}
              </HorizontalScrollSection>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum serviço encontrado nesta categoria.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ServicesList;
