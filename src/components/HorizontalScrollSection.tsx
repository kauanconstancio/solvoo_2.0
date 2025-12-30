import { useRef, useState, useEffect, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorizontalScrollSectionProps {
  children: ReactNode;
  className?: string;
}

const HorizontalScrollSection = ({ children, className = "" }: HorizontalScrollSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollability);
      window.addEventListener("resize", checkScrollability);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", checkScrollability);
      }
      window.removeEventListener("resize", checkScrollability);
    };
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group/scroll">
      {/* Left Arrow */}
      {canScrollLeft && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute -left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-10 md:w-10 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border hover:bg-primary hover:text-primary-foreground transition-all"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className={`flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide scroll-smooth-touch ${className}`}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-10 md:w-10 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border hover:bg-primary hover:text-primary-foreground transition-all"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default HorizontalScrollSection;
