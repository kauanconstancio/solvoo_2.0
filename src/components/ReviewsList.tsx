import { useState } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Review } from "@/hooks/useReviews";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ReviewsListProps {
  reviews: Review[];
  initialLimit?: number;
}

const ReviewsList = ({ reviews, initialLimit = 10 }: ReviewsListProps) => {
  const [visibleCount, setVisibleCount] = useState(initialLimit);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (reviews.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-6">
        Nenhuma avaliação ainda. Seja o primeiro a avaliar!
      </p>
    );
  }

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + initialLimit);
  };

  return (
    <>
      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded-lg border bg-card"
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={review.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted">
                  {getInitials(review.profile?.full_name || null)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium truncate">
                    {review.profile?.full_name || "Usuário"}
                  </p>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate(review.created_at)}
                  </p>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                    {review.comment}
                  </p>
                )}
                
                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {review.images.map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(imageUrl)}
                        className="relative group"
                      >
                        <img
                          src={imageUrl}
                          alt={`Foto ${index + 1} da avaliação`}
                          className="w-20 h-20 object-cover rounded-lg border hover:opacity-90 transition-opacity cursor-pointer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={handleLoadMore}
            >
              Carregar mais avaliações ({reviews.length - visibleCount} restantes)
            </Button>
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Foto da avaliação"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewsList;
