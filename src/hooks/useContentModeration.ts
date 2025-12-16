import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const MODERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-content`;

interface ModerationResult {
  approved: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
  flagged_content?: string;
  autoApproved?: boolean;
}

type ContentType = 'service_title' | 'service_description' | 'review';

export const useContentModeration = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const moderateContent = async (
    content: string,
    type: ContentType
  ): Promise<ModerationResult> => {
    if (!content.trim()) {
      return { approved: true };
    }

    setIsChecking(true);

    try {
      const response = await fetch(MODERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ content, type }),
      });

      if (!response.ok) {
        console.error('Moderation API error:', response.status);
        return { approved: true, autoApproved: true };
      }

      const result: ModerationResult = await response.json();
      return result;
    } catch (error) {
      console.error('Content moderation error:', error);
      return { approved: true, autoApproved: true };
    } finally {
      setIsChecking(false);
    }
  };

  const moderateServiceContent = async (
    title: string,
    description: string
  ): Promise<{ approved: boolean; message?: string }> => {
    // Check title
    const titleResult = await moderateContent(title, 'service_title');
    if (!titleResult.approved) {
      toast({
        title: 'Conteúdo não permitido',
        description: titleResult.reason || 'O título contém conteúdo impróprio.',
        variant: 'destructive',
      });
      return { approved: false, message: titleResult.reason };
    }

    // Check description
    const descResult = await moderateContent(description, 'service_description');
    if (!descResult.approved) {
      toast({
        title: 'Conteúdo não permitido',
        description: descResult.reason || 'A descrição contém conteúdo impróprio.',
        variant: 'destructive',
      });
      return { approved: false, message: descResult.reason };
    }

    return { approved: true };
  };

  const moderateReview = async (
    comment: string
  ): Promise<{ approved: boolean; message?: string }> => {
    if (!comment.trim()) {
      return { approved: true };
    }

    const result = await moderateContent(comment, 'review');
    if (!result.approved) {
      toast({
        title: 'Conteúdo não permitido',
        description: result.reason || 'Seu comentário contém conteúdo impróprio.',
        variant: 'destructive',
      });
      return { approved: false, message: result.reason };
    }

    return { approved: true };
  };

  return {
    moderateContent,
    moderateServiceContent,
    moderateReview,
    isChecking,
  };
};
