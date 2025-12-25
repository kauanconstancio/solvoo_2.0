import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Default quick replies available for all users
const DEFAULT_QUICK_REPLIES = [
  { id: "1", title: "Olá, tudo bem?", content: "Olá, tudo bem?" },
  { id: "2", title: "Ainda está disponível?", content: "Olá! Ainda está disponível?" },
  { id: "3", title: "Aceita oferta?", content: "Olá! Aceita proposta de valor?" },
  { id: "4", title: "Qual o prazo?", content: "Olá! Qual seria o prazo de entrega?" },
  { id: "5", title: "Obrigado!", content: "Muito obrigado pelo atendimento!" },
];

interface QuickRepliesBarProps {
  onSelectTemplate: (content: string) => void;
}

export const QuickRepliesBar = ({ onSelectTemplate }: QuickRepliesBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener("resize", checkScrollArrows);
    return () => window.removeEventListener("resize", checkScrollArrows);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScrollArrows, 300);
    }
  };

  return (
    <div className="relative flex items-center gap-1 py-2 px-2 border-t border-border/50 bg-background/80 backdrop-blur-sm">
      {/* Left arrow */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 rounded-full absolute left-1 z-10 bg-background/90 shadow-sm"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Templates scroll area */}
      <div
        ref={scrollRef}
        onScroll={checkScrollArrows}
        className={cn(
          "flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]",
          showLeftArrow && "pl-7",
          showRightArrow && "pr-7"
        )}
      >
        {DEFAULT_QUICK_REPLIES.map((reply) => (
          <button
            key={reply.id}
            onClick={() => onSelectTemplate(reply.content)}
            className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full border border-border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all active:scale-95 whitespace-nowrap"
          >
            {reply.title}
          </button>
        ))}
      </div>

      {/* Right arrow */}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 rounded-full absolute right-1 z-10 bg-background/90 shadow-sm"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
