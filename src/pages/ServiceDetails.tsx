import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  BadgeCheck,
  Shield,
  MessageSquare,
  Calendar,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { getServiceLabel } from "@/data/services";
import ProviderProfileDialog from "@/components/ProviderProfileDialog";
import { useFavorites } from "@/hooks/useFavorites";

interface ProviderProfile {
  user_id: string;
  full_name: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface ServiceData {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  price: string;
  price_type: string;
  city: string;
  state: string;
  images: string[];
  verified: boolean;
  phone: string | null;
  whatsapp: string | null;
  created_at: string;
  user_id: string;
}

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [service, setService] = useState<ServiceData | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) {
        setError("ID do serviço não encontrado");
        setIsLoading(false);
        return;
      }

      try {
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (serviceError) throw serviceError;

        if (!serviceData) {
          setError("Serviço não encontrado");
          setIsLoading(false);
          return;
        }

        // Fetch provider profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            "user_id, full_name, city, state, avatar_url, bio, created_at"
          )
          .eq("user_id", serviceData.user_id)
          .maybeSingle();

        setService(serviceData);
        setProvider(profileData || null);
      } catch (err: any) {
        console.error("Error fetching service:", err);
        setError("Erro ao carregar o serviço");
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const getPriceTypeLabel = (priceType: string) => {
    const types: Record<string, string> = {
      fixed: "preço fixo",
      hour: "por hora",
      day: "por diária",
      project: "por projeto",
      negotiable: "a combinar",
    };
    return types[priceType] || priceType;
  };

  const getLocation = () => {
    if (!service) return "";
    return `${service.city}, ${service.state.toUpperCase()}`;
  };

  const getProviderInitials = () => {
    if (!provider?.full_name) return "P";
    return provider.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getProviderLocation = () => {
    if (!provider?.city && !provider?.state) return getLocation();
    return `${provider.city || ""}, ${provider.state?.toUpperCase() || ""}`;
  };

  const getMemberSince = () => {
    const date = provider?.created_at || service?.created_at;
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  const defaultImage =
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop";
  const displayImages =
    service?.images && service.images.length > 0
      ? service.images
      : [defaultImage];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">
            {error || "Serviço não encontrado"}
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a página inicial
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="py-4 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <a href="/" className="hover:text-primary transition-smooth">
                Início
              </a>
              <span>/</span>
              <a
                href="/categorias"
                className="hover:text-primary transition-smooth"
              >
                Categorias
              </a>
              <span>/</span>
              <span className="text-foreground">
                {getServiceLabel(service.category)}
              </span>
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section className="py-8 md:py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Images and Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Image Gallery */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-[16/10] bg-muted">
                      <img
                        src={displayImages[selectedImage]}
                        alt={service.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-background/80 backdrop-blur hover:bg-background"
                          onClick={() => {
                            if (service) {
                              toggleFavorite({
                                service_id: service.id,
                                service_title: service.title,
                                service_category: service.category,
                                service_subcategory: service.subcategory,
                                service_image: service.images?.[0] || null,
                                service_price: service.price,
                                service_provider: provider?.full_name || null,
                              });
                            }
                          }}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              service && isFavorite(service.id)
                                ? "fill-red-500 text-red-500"
                                : ""
                            }`}
                          />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-background/80 backdrop-blur hover:bg-background"
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    {displayImages.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 p-4">
                        {displayImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImage === index
                                ? "border-primary"
                                : "border-transparent hover:border-muted-foreground"
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${service.title} ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Service Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {getServiceLabel(service.category)}
                          </Badge>
                          {service.subcategory && (
                            <Badge variant="outline">
                              {service.subcategory}
                            </Badge>
                          )}
                          {service.verified && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                              <BadgeCheck className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl md:text-3xl mb-2">
                          {service.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{getLocation()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Sobre o Serviço
                      </h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {service.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Provider Info and Booking */}
              <div className="space-y-6">
                {/* Price Card */}
                <Card className="hidden md:flex">
                  <CardContent className="p-6 space-y-4 w-full">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        A partir de
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {service.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getPriceTypeLabel(service.price_type)}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Button className="w-full h-12 text-base hover:brightness-110">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Solicitar Orçamento
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <Shield className="h-4 w-4" />
                      <span>Pagamento seguro e protegido</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Price Card */}
                <Card className="md:hidden fixed bottom-0 left-0 right-0 z-50 mx-auto w-full rounded-t-2xl rounded-b-none shadow-2xl bg-background border-t-2 border-b-0">
                  <CardContent className="p-4 pb-6">
                    <div className="flex items-center justify-between gap-5">
                      <div className="flex flex-col w-full">
                        <p className="text-xs text-muted-foreground mb-1">
                          A partir de
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {service.price}
                        </p>
                      </div>
                      <Button className="w-full h-12 text-sm hover:brightness-110">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Solicitar Orçamento
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Provider Card */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Sobre o Profissional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={provider?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getProviderInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {provider?.full_name || "Profissional"}
                          </h3>
                          {service.verified && (
                            <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Membro desde</span>
                        </div>
                        <p className="font-semibold">{getMemberSince()}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Localização</span>
                        </div>
                        <p className="font-semibold">{getProviderLocation()}</p>
                      </div>
                    </div>

                    <Separator />

                    <Button
                      variant="outline"
                      className="w-full hover:gradient-primary"
                      onClick={() => setIsProfileDialogOpen(true)}
                    >
                      Ver perfil completo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ProviderProfileDialog
        userId={service?.user_id || null}
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />

      <Footer />
    </div>
  );
};

export default ServiceDetails;
