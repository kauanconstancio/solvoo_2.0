import { Star, MapPin, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ServiceCardProps {
  title: string;
  provider: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  image: string;
  category: string;
  verified?: boolean;
}

const ServiceCard = ({
  title,
  provider,
  location,
  rating,
  reviews,
  price,
  image,
  category,
  verified = false,
}: ServiceCardProps) => {
  return (
    <Card className="overflow-hidden cursor-pointer group hover:shadow-soft-lg transition-smooth border-2">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="object-cover w-full h-full group-hover:scale-105 transition-smooth duration-500"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 bg-background/80 backdrop-blur hover:bg-background"
        >
          <Heart className="h-4 w-4" />
        </Button>
        <Badge className="absolute bottom-3 left-3 bg-background/90 backdrop-blur text-foreground hover:bg-background/90">
          {category}
        </Badge>
      </div>

      <div className="p-4 md:p-5 space-y-3">
        <div>
          <h3 className="font-semibold text-base md:text-lg mb-1 line-clamp-1 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
            {provider}
            {verified && (
              <span className="text-primary">✓</span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 md:h-4 w-3.5 md:w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{rating}</span>
            <span className="text-muted-foreground">({reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 md:h-4 w-3.5 md:w-4 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t gap-3">
          <div>
            <p className="text-xs text-muted-foreground">A partir de</p>
            <p className="text-lg md:text-xl font-bold text-primary">{price}</p>
          </div>
          <Button className="gradient-accent hover:brightness-110 text-xs md:text-sm px-3 md:px-4">
            Ver Detalhes
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ServiceCard;
