import { useRef } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Loader2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DraggableImageGridProps {
  images: string[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (index: number) => void;
  onAddClick: () => void;
  isUploading?: boolean;
  maxImages?: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface DraggableImageItemProps {
  image: string;
  index: number;
  onRemove: (index: number) => void;
}

const DraggableImageItem = ({ image, index, onRemove }: DraggableImageItemProps) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={image}
      dragListener={false}
      dragControls={controls}
      className="relative aspect-video rounded-lg border border-border overflow-hidden group bg-muted"
      whileDrag={{ scale: 1.05, zIndex: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
      transition={{ duration: 0.2 }}
    >
      <img
        src={image}
        alt={`Foto ${index + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Drag Handle */}
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="absolute top-2 left-2 p-1.5 bg-background/80 backdrop-blur rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="w-4 h-4 text-foreground" />
      </button>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remover imagem"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Principal Badge */}
      {index === 0 && (
        <Badge className="absolute bottom-2 left-2 text-xs pointer-events-none">
          Principal
        </Badge>
      )}
    </Reorder.Item>
  );
};

export const DraggableImageGrid = ({
  images,
  onReorder,
  onRemove,
  onAddClick,
  isUploading = false,
  maxImages = 5,
  fileInputRef,
  onFileSelect,
}: DraggableImageGridProps) => {
  return (
    <div className="space-y-4">
      <Reorder.Group
        axis="x"
        values={images}
        onReorder={onReorder}
        className={cn(
          "grid gap-4",
          images.length === 0 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-5"
        )}
      >
        {images.map((image, index) => (
          <DraggableImageItem
            key={image}
            image={image}
            index={index}
            onRemove={onRemove}
          />
        ))}

        {images.length < maxImages && (
          <div className="contents">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={onAddClick}
              disabled={isUploading}
              className={cn(
                "aspect-video rounded-lg border-2 border-dashed border-border",
                "hover:border-primary hover:bg-primary/5 transition-colors",
                "flex flex-col items-center justify-center gap-2",
                "text-muted-foreground hover:text-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
              <span className="text-xs font-medium">
                {isUploading ? "Enviando..." : "Adicionar"}
              </span>
            </button>
          </div>
        )}
      </Reorder.Group>

      {images.length > 1 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <GripVertical className="w-3 h-3" />
          Arraste as imagens para reordenar. A primeira será a foto principal.
        </p>
      )}
    </div>
  );
};
