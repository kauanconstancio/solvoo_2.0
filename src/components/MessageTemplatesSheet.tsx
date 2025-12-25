import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  MessageSquareText,
} from "lucide-react";
import { useMessageTemplates, MessageTemplate } from "@/hooks/useMessageTemplates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageTemplatesSheetProps {
  onSelectTemplate: (content: string) => void;
  trigger?: React.ReactNode;
}

export const MessageTemplatesSheet = ({
  onSelectTemplate,
  trigger,
}: MessageTemplatesSheetProps) => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } =
    useMessageTemplates();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setIsCreating(false);
    setTitle(template.title);
    setContent(template.content);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    if (isCreating) {
      await createTemplate(title.trim(), content.trim());
    } else if (editingId) {
      await updateTemplate(editingId, title.trim(), content.trim());
    }
    setIsSaving(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    await deleteTemplate(templateToDelete);
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    onSelectTemplate(template.content);
    setOpen(false);
  };

  const confirmDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Zap className="h-5 w-5" />
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              Respostas Rápidas
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {!isCreating && !editingId && (
              <Button onClick={handleCreate} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            )}

            {(isCreating || editingId) && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <Input
                  placeholder="Título do template"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-medium"
                />
                <Textarea
                  placeholder="Conteúdo da mensagem..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!title.trim() || !content.trim() || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="h-[calc(100vh-280px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquareText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum template criado ainda.</p>
                  <p className="text-xs mt-1">
                    Crie templates para enviar respostas rápidas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleSelectTemplate(template)}
                          className="flex-1 text-left"
                        >
                          <h4 className="font-medium text-sm">{template.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {template.content}
                          </p>
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(template)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => confirmDelete(template.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
