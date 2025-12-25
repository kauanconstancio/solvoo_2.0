-- Create table to track archived conversations per user
CREATE TABLE public.conversation_archives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE public.conversation_archives ENABLE ROW LEVEL SECURITY;

-- Users can view their own archives
CREATE POLICY "Users can view their own archives"
ON public.conversation_archives
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own archives
CREATE POLICY "Users can insert their own archives"
ON public.conversation_archives
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own archives (unarchive)
CREATE POLICY "Users can delete their own archives"
ON public.conversation_archives
FOR DELETE
USING (auth.uid() = user_id);