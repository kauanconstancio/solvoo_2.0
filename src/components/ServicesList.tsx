import { useEffect, useState } from "react";
import ServiceCard from "./ServiceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { serviceCategories } from "@/data/services";

interface Service {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  price: string;
  city: string;
  state: string;
  images: string[];
  verified: boolean;
  provider_name: string | null;
}

const ServicesList = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const { data: servicesData, error } = await supabase
          .from("services")
          .select("id, title, category, subcategory, price, city, state, images, verified, user_id")
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
              city: service.city,
              state: service.state,
              images: service.images || [],
              verified: service.verified,
              provider_name: profileData?.full_name || null,
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

  const getLocation = (city: string, state: string) => {
    return `${city}, ${state.toUpperCase()}`;
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full sm:w-auto mb-6 flex-wrap h-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {serviceCategories.slice(0, 8).map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    id={service.id}
                    title={service.title}
                    provider={service.provider_name || undefined}
                    location={getLocation(service.city, service.state)}
                    price={service.price}
                    image={service.images?.[0]}
                    category={service.category}
                    subcategory={service.subcategory}
                    verified={service.verified}
                    providerName={service.provider_name}
                  />
                ))}
              </div>
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
