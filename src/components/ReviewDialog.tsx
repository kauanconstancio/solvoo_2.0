import { useState, useRef } from "react";
import { Star, Loader2, ImagePlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useContentModeration } from "@/hooks/useContentModeration";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    rating: number,
    comment: string,
    images: string[]
  ) => Promise<{ error: string | null }>;
  serviceTitle: string;
}

const ReviewDialog = ({
  open,
  onOpenChange,
  onSubmit,
  serviceTitle,
}: ReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { moderateReview, isChecking: isModerating } = useContentModeration();
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({
        title: "Limite excedido",
        description: "Você pode adicionar no máximo 5 fotos",
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Arquivo inválido",
          description: "Apenas imagens são permitidas",
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 5MB por imagem",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      for (const image of images) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("review-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("review-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Erro ao enviar fotos",
        description: "Não foi possível enviar as fotos. Tente novamente.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);

    // Moderation check for comment
    if (comment.trim()) {
      const moderationResult = await moderateReview(comment);
      if (!moderationResult.approved) {
        setIsSubmitting(false);
        return;
      }
    }

    // Upload images
    const uploadedImageUrls = await uploadImages();

    const result = await onSubmit(rating, comment, uploadedImageUrls);
    setIsSubmitting(false);

    if (!result.error) {
      setRating(0);
      setComment("");
      setImages([]);
      setImagePreviews([]);
      onOpenChange(false);
    }
  };

  const displayRating = hoverRating || rating;
  const isLoading = isSubmitting || isModerating || isUploadingImages;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95%] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar Serviço</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Como foi sua experiência com <strong>{serviceTitle}</strong>?
            </p>
          </div>

          <div className="space-y-2">
            <Label>Sua avaliação</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Ruim"}
                {rating === 2 && "Regular"}
                {rating === 3 && "Bom"}
                {rating === 4 && "Muito bom"}
                {rating === 5 && "Excelente"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Conte como foi sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos do serviço (opcional)</Label>
            <p className="text-xs text-muted-foreground">
              Adicione até 5 fotos do serviço realizado
            </p>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 hover:bg-transparent hover:text-black transition-smooth"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isUploadingImages
              ? "Enviando fotos..."
              : isModerating
              ? "Verificando..."
              : isSubmitting
              ? "Enviando..."
              : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
