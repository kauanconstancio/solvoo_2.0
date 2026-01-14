import { Heart, Star, Zap, FileText, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { getServiceUrl } from "@/lib/slugUtils";

interface ServiceCardCompactProps {
  id: string;
  title: string;
  price: string;
  priceType?: string;
  image?: string;
  category: string;
  subcategory?: string | null;
  providerName?: string | null;
  slug?: string | null;
  rating?: number;
  reviewCount?: number;
  promotion?: {
    discount_percentage: number | null;
    promotional_price: string;
    original_price: string;
  } | null;
}

const ServiceCardCompact = ({
  id,
  title,
  price,
  priceType = "negotiable",
  image,
  category,
  subcategory,
  providerName = null,
  slug = null,
  rating = 0,
  reviewCount = 0,
  promotion = null,
}: ServiceCardCompactProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const displayImage =
    image ||
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop";
  const favorited = isFavorite(id);
  const serviceUrl = getServiceUrl({ id, slug });
  const isFixedPrice = priceType !== "negotiable";
  const hasPromotion = !!promotion;

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
      service_provider: providerName || null,
    });
  };

  return (
    <Link to={serviceUrl}>
      <Card className="overflow-hidden cursor-pointer group hover:shadow-md transition-all duration-200 border w-[220px] min-w-[220px] max-w-[220px] md:w-[280px] md:min-w-[280px] md:max-w-[280px]">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {hasPromotion && promotion.discount_percentage && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground font-bold text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
              <Percent className="h-2.5 w-2.5" />
              -{promotion.discount_percentage}%
            </Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur hover:bg-background/90"
            onClick={handleFavoriteClick}
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                favorited ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
            />
          </Button>
        </div>

        <div className="p-2.5 flex flex-col h-[90px]">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-xs h-4 mt-1">
            {rating > 0 ? (
              <>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewCount})</span>
              </>
            ) : (
              <span className="text-muted-foreground">Sem avaliações</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-auto">
            {isFixedPrice ? (
              <Zap className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            )}
            {hasPromotion ? (
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground line-through">
                  {promotion.original_price}
                </p>
                <p className="text-base font-bold text-destructive">
                  {promotion.promotional_price}
                </p>
              </div>
            ) : (
              <p className="text-base font-bold text-primary">
                {price}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ServiceCardCompact;
