import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MessageTemplate {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTemplates([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const createTemplate = async (title: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("message_templates")
        .insert({
          user_id: user.id,
          title,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates((prev) => [data, ...prev]);
      toast({
        title: "Template criado",
        description: "Seu template foi salvo com sucesso.",
      });
      return data;
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o template.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, title: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .update({ title, content })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? data : t))
      );
      toast({
        title: "Template atualizado",
        description: "Seu template foi atualizado com sucesso.",
      });
      return data;
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o template.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: "Template excluído",
        description: "Seu template foi excluído com sucesso.",
      });
      return true;
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
};
