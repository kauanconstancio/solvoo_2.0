import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  title: string;
  className?: string;
  showThumbnails?: boolean;
  aspectRatio?: "video" | "square" | "4/3";
}

export const ImageGallery = ({
  images,
  title,
  className,
  showThumbnails = true,
  aspectRatio = "video",
}: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });
  const [fullscreenRef, fullscreenApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    thumbApi?.scrollTo(index);
  }, [emblaApi, thumbApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // Sync fullscreen carousel with main carousel
  useEffect(() => {
    if (isFullscreen && fullscreenApi) {
      fullscreenApi.scrollTo(selectedIndex, true);
    }
  }, [isFullscreen, fullscreenApi, selectedIndex]);

  const handleFullscreenSelect = useCallback(() => {
    if (!fullscreenApi) return;
    const index = fullscreenApi.selectedScrollSnap();
    setSelectedIndex(index);
    emblaApi?.scrollTo(index);
  }, [fullscreenApi, emblaApi]);

  useEffect(() => {
    if (!fullscreenApi) return;
    fullscreenApi.on("select", handleFullscreenSelect);
  }, [fullscreenApi, handleFullscreenSelect]);

  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square",
    "4/3": "aspect-[4/3]",
  }[aspectRatio];

  if (images.length === 0) return null;

  return (
    <>
      <div className={cn("relative group", className)}>
        {/* Main Carousel */}
        <div className="overflow-hidden rounded-xl" ref={emblaRef}>
          <div className="flex">
            {images.map((image, index) => (
              <div
                key={index}
                className={cn("relative flex-[0_0_100%] min-w-0", aspectClass)}
              >
                <img
                  src={image}
                  alt={`${title} - Imagem ${index + 1}`}
                  className="object-cover w-full h-full"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Fullscreen Button */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          onClick={() => setIsFullscreen(true)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        {/* Dot Indicators (mobile) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  selectedIndex === index
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/70"
                )}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image Counter */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-medium">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-3 overflow-hidden hidden md:block" ref={thumbRef}>
          <div className="flex gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  "relative flex-[0_0_80px] aspect-video rounded-lg overflow-hidden border-2 transition-all",
                  selectedIndex === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/50 opacity-70 hover:opacity-100"
                )}
              >
                <img
                  src={image}
                  alt={`${title} - Miniatura ${index + 1}`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="relative h-[85vh]" ref={fullscreenRef}>
            <div className="flex h-full">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative flex-[0_0_100%] min-w-0 flex items-center justify-center p-4"
                >
                  <img
                    src={image}
                    alt={`${title} - Imagem ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            {/* Fullscreen Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => fullscreenApi?.scrollPrev()}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => fullscreenApi?.scrollNext()}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Fullscreen Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-sm font-medium">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
