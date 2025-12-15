import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const REPORT_REASONS = [
  { value: "spam", label: "Spam ou conteúdo enganoso" },
  { value: "harassment", label: "Assédio ou comportamento abusivo" },
  { value: "inappropriate", label: "Conteúdo inapropriado" },
  { value: "fraud", label: "Fraude ou golpe" },
  { value: "fake", label: "Perfil falso" },
  { value: "other", label: "Outro motivo" },
];

interface ReportUserDialogProps {
  reportedUserId: string;
  reportedUserName?: string | null;
  trigger?: React.ReactNode;
}

const ReportUserDialog = ({
  reportedUserId,
  reportedUserName,
  trigger,
}: ReportUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Selecione um motivo",
        description: "Por favor, selecione o motivo da denúncia.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para fazer uma denúncia.",
          variant: "destructive",
        });
        return;
      }

      if (user.id === reportedUserId) {
        toast({
          title: "Erro",
          description: "Você não pode denunciar a si mesmo.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason: reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Denúncia enviada",
        description: "Sua denúncia foi registrada e será analisada pela nossa equipe.",
      });

      setOpen(false);
      setReason("");
      setDescription("");
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({
        title: "Erro ao enviar denúncia",
        description: "Não foi possível enviar a denúncia. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Flag className="h-4 w-4 mr-2" />
            Denunciar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Denunciar Usuário
          </DialogTitle>
          <DialogDescription>
            {reportedUserName 
              ? `Denunciar ${reportedUserName}. `
              : ""}
            Por favor, selecione o motivo da denúncia. Nossa equipe irá analisar o caso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Motivo da denúncia *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detalhes adicionais (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva com mais detalhes o problema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Denúncia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserDialog;
