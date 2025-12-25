import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  BadgeCheck,
  Loader2,
  Star,
  PenLine,
  Flag,
} from "lucide-react";
import ReportUserDialog from "@/components/ReportUserDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getServiceLabel } from "@/data/services";
import ServiceCard from "@/components/ServiceCard";
import { useProviderRating } from "@/hooks/useReviews";
import ReviewsList from "@/components/ReviewsList";
import ReviewDialog from "@/components/ReviewDialog";
import { useToast } from "@/hooks/use-toast";

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
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedServiceForReview, setSelectedServiceForReview] =
    useState<ServiceItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const {
    providerRating,
    serviceRatings,
    allReviews,
    isLoading: isRatingLoading,
    refetchProviderRating,
  } = useProviderRating(userId);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

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
          .select(
            "id, title, category, subcategory, price, city, state, images, verified"
          )
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

  const handleWriteReview = () => {
    if (!currentUserId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para avaliar",
        variant: "destructive",
      });
      return;
    }

    if (currentUserId === userId) {
      toast({
        title: "Erro",
        description: "Você não pode avaliar seus próprios serviços",
        variant: "destructive",
      });
      return;
    }

    if (services.length === 1) {
      setSelectedServiceForReview(services[0]);
      setIsReviewDialogOpen(true);
    } else if (services.length > 1) {
      // For now, open dialog for first service - could be enhanced with service selector
      setSelectedServiceForReview(services[0]);
      setIsReviewDialogOpen(true);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string, images: string[] = []) => {
    if (!selectedServiceForReview || !currentUserId) {
      return { error: "Invalid state" };
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        service_id: selectedServiceForReview.id,
        user_id: currentUserId,
        rating,
        comment: comment || null,
        images: images.length > 0 ? images : null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Erro",
            description: "Você já avaliou este serviço",
            variant: "destructive",
          });
          return { error: "Already reviewed" };
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Avaliação enviada com sucesso!",
      });

      // Refetch reviews to update the list
      await refetchProviderRating();

      return { error: null };
    } catch (error: any) {
      console.error("Error adding review:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a avaliação",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-[calc(100%-2rem)] sm:w-[95%] rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>Perfil do Profissional</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : provider ? (
            <div className="space-y-6 overflow-x-hidden">
              {/* Provider Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 flex-shrink-0">
                  <AvatarImage src={provider.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getProviderInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-md font-semibold break-words">
                      {provider.full_name || "Profissional"}
                    </h2>
                    <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>

                  {/* Rating Summary */}
                  {providerRating && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {providerRating.average_rating}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({providerRating.total_reviews} avaliações)
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">
                        {getProviderLocation()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">
                        Membro desde {getMemberSince()}
                      </span>
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

              {/* Service Ratings Summary */}
              {serviceRatings.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">
                      Avaliações por Serviço
                    </h3>
                    <div className="space-y-2">
                      {serviceRatings.map((sr) => (
                        <div
                          key={sr.service_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <span className="text-sm font-medium truncate flex-1 mr-2">
                            {sr.title}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">
                              {sr.average_rating}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({sr.review_count})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
                    {services.map((service) => {
                      const serviceRating = serviceRatings.find(
                        (sr) => sr.service_id === service.id
                      );
                      return (
                        <div
                          key={service.id}
                          onClick={() => onOpenChange(false)}
                        >
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
                            providerName={provider.full_name}
                            rating={serviceRating?.average_rating}
                            reviewCount={serviceRating?.review_count}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum serviço cadastrado ainda.
                  </p>
                )}
              </div>

              {/* Reviews Section */}
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    Avaliações ({allReviews.length})
                  </h3>
                  {services.length > 0 && currentUserId !== userId && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-primary text-black hover:text-primary-foreground transition-smooth"
                        onClick={handleWriteReview}
                      >
                        <PenLine className="h-4 w-4 mr-2" />
                        Escrever avaliação
                      </Button>
                      {userId && (
                        <ReportUserDialog
                          reportedUserId={userId}
                          reportedUserName={provider?.full_name}
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-smooth"
                            >
                              <Flag className="h-4 w-4" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
                <ReviewsList reviews={allReviews} />
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Perfil não encontrado.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {selectedServiceForReview && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          onSubmit={handleSubmitReview}
          serviceTitle={selectedServiceForReview.title}
        />
      )}
    </>
  );
};

export default ProviderProfileDialog;
