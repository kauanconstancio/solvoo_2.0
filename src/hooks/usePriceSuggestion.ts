import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const SUGGEST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-price`;

interface PriceSuggestion {
  recommended: number;
  range: {
    min: number;
    max: number;
  };
  market: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  localMarket: {
    avg: number;
    count: number;
  } | null;
}

interface PriceSuggestionResponse {
  suggestion: PriceSuggestion | null;
  insight: string;
  servicesAnalyzed: number;
  message?: string;
  category: string;
  subcategory: string | null;
}

export const usePriceSuggestion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<PriceSuggestionResponse | null>(null);
  const { toast } = useToast();

  const suggestPrice = async (
    category: string,
    subcategory?: string,
    state?: string,
    city?: string
  ): Promise<PriceSuggestionResponse | null> => {
    if (!category) {
      toast({
        title: 'Categoria obrigatória',
        description: 'Selecione uma categoria para obter sugestão de preço.',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    setSuggestion(null);

    try {
      const response = await fetch(SUGGEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ category, subcategory, state, city }),
      });

      if (!response.ok) {
        throw new Error('Erro ao obter sugestão de preço');
      }

      const data: PriceSuggestionResponse = await response.json();
      setSuggestion(data);

      if (!data.suggestion) {
        toast({
          title: 'Dados insuficientes',
          description: data.message || 'Não há serviços similares para análise.',
        });
      }

      return data;
    } catch (error) {
      console.error('Price suggestion error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível obter sugestão de preço.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestion = () => setSuggestion(null);

  return {
    suggestPrice,
    clearSuggestion,
    suggestion,
    isLoading,
  };
};
