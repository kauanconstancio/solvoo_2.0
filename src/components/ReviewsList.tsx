import { useState, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, MessageSquare, CornerDownRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Review } from "@/hooks/useReviews";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ReviewResponseDialog from "./ReviewResponseDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewsListProps {
  reviews: Review[];
  initialLimit?: number;
  currentUserId?: string | null;
  serviceOwnerId?: string | null;
  onReviewUpdated?: () => void;
}

interface GalleryState {
  images: string[];
  currentIndex: number;
}

const ReviewsList = ({ 
  reviews, 
  initialLimit = 10, 
  currentUserId,
  serviceOwnerId,
  onReviewUpdated 
}: ReviewsListProps) => {
  const [visibleCount, setVisibleCount] = useState(initialLimit);
  const [gallery, setGallery] = useState<GalleryState | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [responseDialogReview, setResponseDialogReview] = useState<Review | null>(null);
  const { toast } = useToast();

  const canRespond = currentUserId && serviceOwnerId && currentUserId === serviceOwnerId;

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

  const openGallery = (images: string[], startIndex: number) => {
    setGallery({ images, currentIndex: startIndex });
    setZoomLevel(1);
  };

  const closeGallery = () => {
    setGallery(null);
    setZoomLevel(1);
  };

  const navigateGallery = useCallback((direction: 'prev' | 'next') => {
    if (!gallery) return;
    
    const newIndex = direction === 'next'
      ? (gallery.currentIndex + 1) % gallery.images.length
      : (gallery.currentIndex - 1 + gallery.images.length) % gallery.images.length;
    
    setGallery({ ...gallery, currentIndex: newIndex });
    setZoomLevel(1);
  }, [gallery]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleSubmitResponse = async (responseText: string) => {
    if (!responseDialogReview || !currentUserId) {
      return { error: "Invalid state" };
    }

    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          response_text: responseText,
          response_at: new Date().toISOString(),
          responded_by: currentUserId,
        })
        .eq("id", responseDialogReview.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resposta enviada com sucesso!",
      });

      onReviewUpdated?.();
      return { error: null };
    } catch (error: any) {
      console.error("Error submitting response:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a resposta",
        variant: "destructive",
      });
      return { error: error.message };
    }
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
                
                {/* Review Images with Carousel Preview */}
                {review.images && review.images.length > 0 && (
                  <div className="mt-2">
                    {review.images.length <= 4 ? (
                      <div className="flex flex-wrap gap-2">
                        {review.images.map((imageUrl, index) => (
                          <button
                            key={index}
                            onClick={() => openGallery(review.images!, index)}
                            className="relative group overflow-hidden rounded-lg"
                          >
                            <img
                              src={imageUrl}
                              alt={`Foto ${index + 1} da avaliação`}
                              className="w-20 h-20 object-cover border hover:scale-105 transition-transform duration-200 cursor-pointer"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Carousel className="w-full max-w-[300px]">
                        <CarouselContent>
                          {review.images.map((imageUrl, index) => (
                            <CarouselItem key={index} className="basis-1/3">
                              <button
                                onClick={() => openGallery(review.images!, index)}
                                className="relative group overflow-hidden rounded-lg"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Foto ${index + 1} da avaliação`}
                                  className="w-20 h-20 object-cover border hover:scale-105 transition-transform duration-200 cursor-pointer"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-0 h-8 w-8" />
                        <CarouselNext className="right-0 h-8 w-8" />
                      </Carousel>
                    )}
                  </div>
                )}

                {/* Professional Response Section */}
                {review.response_text && (
                  <div className="mt-4 pl-4 border-l-2 border-primary/30 bg-muted/30 p-3 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CornerDownRight className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        Resposta do profissional
                      </span>
                      {review.response_at && (
                        <span className="text-xs text-muted-foreground">
                          • {formatDate(review.response_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {review.response_text}
                    </p>
                  </div>
                )}

                {/* Reply Button for Professional */}
                {canRespond && !review.response_text && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => setResponseDialogReview(review)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Responder avaliação
                  </Button>
                )}

                {/* Edit Response Button for Professional */}
                {canRespond && review.response_text && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-muted-foreground hover:text-primary"
                    onClick={() => setResponseDialogReview(review)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Editar resposta
                  </Button>
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

      {/* Full Screen Image Gallery with Zoom */}
      <Dialog open={!!gallery} onOpenChange={closeGallery}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none">
          {gallery && (
            <div className="relative w-full h-[90vh] flex flex-col">
              {/* Header Controls */}
              <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4">
                <span className="text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
                  {gallery.currentIndex + 1} / {gallery.images.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 text-white hover:bg-white/20"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                  <span className="text-white/80 text-sm min-w-[50px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 text-white hover:bg-white/20"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 text-white hover:bg-white/20 ml-2"
                    onClick={closeGallery}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Main Image Area */}
              <div className="flex-1 flex items-center justify-center overflow-auto">
                <div 
                  className="transition-transform duration-200 ease-out"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={gallery.images[gallery.currentIndex]}
                    alt={`Foto ${gallery.currentIndex + 1} da avaliação`}
                    className="max-w-full max-h-[80vh] object-contain cursor-zoom-in"
                    onClick={handleZoomIn}
                    draggable={false}
                  />
                </div>
              </div>

              {/* Navigation Arrows */}
              {gallery.images.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20 rounded-full"
                    onClick={() => navigateGallery('prev')}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20 rounded-full"
                    onClick={() => navigateGallery('next')}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* Thumbnail Strip */}
              {gallery.images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                  <div className="flex gap-2 bg-black/50 p-2 rounded-lg max-w-full overflow-x-auto">
                    {gallery.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setGallery({ ...gallery, currentIndex: idx });
                          setZoomLevel(1);
                        }}
                        className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all ${
                          idx === gallery.currentIndex 
                            ? "ring-2 ring-white scale-110" 
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      {responseDialogReview && (
        <ReviewResponseDialog
          open={!!responseDialogReview}
          onOpenChange={(open) => !open && setResponseDialogReview(null)}
          onSubmit={handleSubmitResponse}
          reviewerName={responseDialogReview.profile?.full_name || "Usuário"}
          existingResponse={responseDialogReview.response_text}
        />
      )}
    </>
  );
};

export default ReviewsList;
