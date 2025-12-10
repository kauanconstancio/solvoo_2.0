import { useState, useEffect } from "react";
import { MapPin, Calendar, BadgeCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { getServiceLabel } from "@/data/services";
import ServiceCard from "@/components/ServiceCard";

interface ProviderProfile {
  user_id: string;
  full_name: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  price: string;
  city: string;
  state: string;
  images: string[] | null;
  verified: boolean;
}

interface ProviderProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProviderProfileDialog = ({
  userId,
  open,
  onOpenChange,
}: ProviderProfileDialogProps) => {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProviderData = async () => {
      if (!userId || !open) return;

      setIsLoading(true);
      try {
        // Fetch provider profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            "user_id, full_name, city, state, avatar_url, bio, created_at"
          )
          .eq("user_id", userId)
          .maybeSingle();

        setProvider(profileData);

        // Fetch provider services
        const { data: servicesData } = await supabase
          .from("services")
          .select("id, title, category, subcategory, price, city, state, images, verified")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        setServices(servicesData || []);
      } catch (err) {
        console.error("Error fetching provider data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviderData();
  }, [userId, open]);

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
    if (!provider?.city && !provider?.state) return "Não informado";
    return `${provider.city || ""}, ${provider.state?.toUpperCase() || ""}`;
  };

  const getMemberSince = () => {
    if (!provider?.created_at) return "";
    return new Date(provider.created_at).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95%] rounded-xl">
        <DialogHeader>
          <DialogTitle>Perfil do Profissional</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : provider ? (
          <div className="space-y-6">
            {/* Provider Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={provider.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getProviderInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold">
                    {provider.full_name || "Profissional"}
                  </h2>
                  <BadgeCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{getProviderLocation()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Membro desde {getMemberSince()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {provider.bio && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Sobre</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {provider.bio}
                  </p>
                </div>
              </>
            )}

            {/* Services */}
            <Separator />
            <div>
              <h3 className="font-semibold mb-4">
                Serviços ({services.length})
              </h3>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div key={service.id} onClick={() => onOpenChange(false)}>
                      <ServiceCard
                        id={service.id}
                        title={service.title}
                        category={service.category}
                        subcategory={service.subcategory}
                        price={service.price}
                        location={`${
                          service.city
                        }, ${service.state.toUpperCase()}`}
                        image={
                          service.images?.[0] ||
                          "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"
                        }
                        provider={provider.full_name || "Profissional"}
                        verified={service.verified}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum serviço cadastrado ainda.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Perfil não encontrado.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProviderProfileDialog;
