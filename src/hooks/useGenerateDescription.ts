import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-description`;

export const useGenerateDescription = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDescription = async (
    title: string,
    category: string,
    subcategory?: string
  ): Promise<string | null> => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Preencha o título do serviço para gerar a descrição.',
        variant: 'destructive',
      });
      return null;
    }

    if (!category) {
      toast({
        title: 'Categoria obrigatória',
        description: 'Selecione uma categoria para gerar a descrição.',
        variant: 'destructive',
      });
      return null;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ title, category, subcategory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar descrição');
      }

      const data = await response.json();
      
      toast({
        title: 'Descrição gerada!',
        description: 'A IA criou uma descrição para seu serviço. Revise e ajuste conforme necessário.',
      });

      return data.description;
    } catch (error) {
      console.error('Generate description error:', error);
      toast({
        title: 'Erro ao gerar descrição',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateDescription, isGenerating };
};
