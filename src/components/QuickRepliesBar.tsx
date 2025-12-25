import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Hand, Package, Tag, Clock, Heart, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Default quick replies available for all users
const DEFAULT_QUICK_REPLIES: { id: string; title: string; content: string; icon: LucideIcon; color: string }[] = [
  { id: "1", title: "Olá!", content: "Olá, tudo bem?", icon: Hand, color: "text-amber-500" },
  { id: "2", title: "Disponível?", content: "Olá! Ainda está disponível?", icon: Package, color: "text-blue-500" },
  { id: "3", title: "Aceita oferta?", content: "Olá! Aceita proposta de valor?", icon: Tag, color: "text-emerald-500" },
  { id: "4", title: "Qual o prazo?", content: "Olá! Qual seria o prazo de entrega?", icon: Clock, color: "text-purple-500" },
  { id: "5", title: "Obrigado!", content: "Muito obrigado pelo atendimento!", icon: Heart, color: "text-rose-500" },
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
        {DEFAULT_QUICK_REPLIES.map((reply) => {
          const Icon = reply.icon;
          return (
            <button
              key={reply.id}
              onClick={() => onSelectTemplate(reply.content)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-95 whitespace-nowrap shadow-sm"
            >
              <Icon className={cn("h-3.5 w-3.5", reply.color)} />
              <span>{reply.title}</span>
            </button>
          );
        })}
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
