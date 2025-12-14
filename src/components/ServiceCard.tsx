import { Star, MapPin, Heart, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getServiceLabel } from "@/data/services";
import { useFavorites } from "@/hooks/useFavorites";

interface ServiceCardProps {
  id: string;
  title: string;
  provider?: string;
  location: string;
  rating?: number;
  reviewCount?: number;
  price: string;
  image?: string;
  category: string;
  subcategory?: string | null;
  verified?: boolean;
  providerName?: string | null;
}

const ServiceCard = ({
  id,
  title,
  provider,
  location,
  rating = 0,
  reviewCount = 0,
  price,
  image,
  category,
  subcategory,
  verified = false,
  providerName = null,
}: ServiceCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const displayImage =
    image ||
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop";
  const categoryLabel = getServiceLabel(category);
  const favorited = isFavorite(id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite({
      service_id: id,
      service_title: title,
      service_category: category,
      service_subcategory: subcategory || null,
      service_image: image || null,
      service_price: price,
      service_provider: providerName || provider || null,
    });
  };

  return (
    <Link to={`/servico/${id}`}>
      <Card className="overflow-hidden cursor-pointer group hover:shadow-soft-lg transition-smooth border-2">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-105 transition-smooth duration-500"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 bg-background/80 backdrop-blur hover:bg-background/90"
            onClick={handleFavoriteClick}
          >
            <Heart
              className={`h-4 w-4 ${
                favorited ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
            />
          </Button>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <Badge className="bg-background/70 backdrop-blur text-foreground hover:bg-background/90">
              {categoryLabel}
            </Badge>
            {subcategory && (
              <Badge
                variant="outline"
                className="bg-background/70 backdrop-blur text-foreground hover:bg-background/90"
              >
                {subcategory}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 md:p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-base md:text-lg mb-1 line-clamp-1 group-hover:text-primary transition-smooth">
              {title}
            </h3>
            {provider && (
              <p className="text-xs md:text-sm text-muted-foreground flex gap-1">
                {provider}
                {verified && (
                  <span className="text-primary">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 md:h-4 w-3.5 md:w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{rating}</span>
                <span className="text-muted-foreground">({reviewCount})</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 md:h-4 w-3.5 md:w-4 flex-shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t gap-3">
            <div>
              <p className="text-xs text-muted-foreground">A partir de</p>
              <p className="text-lg md:text-xl font-bold text-primary">
                {price}
              </p>
            </div>
            <Button className="hover:brightness-110 text-xs md:text-sm px-3 md:px-4 bg-primary text-primary-foreground">
              Ver Detalhes
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ServiceCard;
