import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReviewResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (responseText: string) => Promise<{ error: string | null }>;
  reviewerName: string;
  existingResponse?: string | null;
}

const ReviewResponseDialog = ({
  open,
  onOpenChange,
  onSubmit,
  reviewerName,
  existingResponse,
}: ReviewResponseDialogProps) => {
  const [response, setResponse] = useState(existingResponse || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setIsSubmitting(true);
    const result = await onSubmit(response.trim());
    setIsSubmitting(false);

    if (!result.error) {
      onOpenChange(false);
      setResponse("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setResponse(existingResponse || "");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingResponse ? "Editar Resposta" : "Responder Avaliação"}
          </DialogTitle>
          <DialogDescription>
            {existingResponse
              ? `Edite sua resposta à avaliação de ${reviewerName}`
              : `Escreva uma resposta à avaliação de ${reviewerName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="response">Sua resposta</Label>
            <Textarea
              id="response"
              placeholder="Agradeça o feedback e responda de forma profissional..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {response.length}/1000 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!response.trim() || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingResponse ? "Salvar" : "Enviar Resposta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewResponseDialog;
