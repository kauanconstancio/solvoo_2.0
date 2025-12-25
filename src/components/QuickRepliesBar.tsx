import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { MessageTemplatesSheet } from "@/components/MessageTemplatesSheet";
import { cn } from "@/lib/utils";

interface QuickRepliesBarProps {
  onSelectTemplate: (content: string) => void;
}

export const QuickRepliesBar = ({ onSelectTemplate }: QuickRepliesBarProps) => {
  const { templates, isLoading } = useMessageTemplates();
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
  }, [templates]);

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

  if (isLoading || templates.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center gap-1 py-2 border-t border-border/50 bg-background/80 backdrop-blur-sm">
      {/* Left arrow */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 rounded-full absolute left-0 z-10 bg-background/90 shadow-sm"
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
          showLeftArrow && "pl-8",
          showRightArrow && "pr-8"
        )}
      >
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.content)}
            className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full border border-border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all active:scale-95 whitespace-nowrap"
          >
            {template.title}
          </button>
        ))}

        {/* Settings button to manage templates */}
        <MessageTemplatesSheet
          onSelectTemplate={onSelectTemplate}
          trigger={
            <button className="flex-shrink-0 p-2 rounded-full border border-dashed border-border hover:bg-muted/50 hover:border-primary/50 transition-all active:scale-95">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </button>
          }
        />
      </div>

      {/* Right arrow */}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 rounded-full absolute right-0 z-10 bg-background/90 shadow-sm"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
