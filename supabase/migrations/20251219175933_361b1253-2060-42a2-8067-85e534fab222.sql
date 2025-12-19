-- Create table to track conversation clearances per user
CREATE TABLE public.conversation_clearances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  cleared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE public.conversation_clearances ENABLE ROW LEVEL SECURITY;

-- Users can view their own clearances
CREATE POLICY "Users can view their own clearances"
ON public.conversation_clearances FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own clearances
CREATE POLICY "Users can insert their own clearances"
ON public.conversation_clearances FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own clearances
CREATE POLICY "Users can update their own clearances"
ON public.conversation_clearances FOR UPDATE
USING (auth.uid() = user_id);