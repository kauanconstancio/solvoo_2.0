-- Create quotes table for formal budget proposals
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  professional_id UUID NOT NULL,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  validity_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  client_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Professionals can create quotes in their conversations
CREATE POLICY "Professionals can create quotes"
ON public.quotes
FOR INSERT
WITH CHECK (
  auth.uid() = professional_id AND
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = quotes.conversation_id
    AND conversations.professional_id = auth.uid()
  )
);

-- Users can view quotes in their conversations
CREATE POLICY "Users can view their quotes"
ON public.quotes
FOR SELECT
USING (
  auth.uid() = professional_id OR auth.uid() = client_id
);

-- Professionals can update/cancel their quotes
CREATE POLICY "Professionals can update their quotes"
ON public.quotes
FOR UPDATE
USING (auth.uid() = professional_id);

-- Clients can respond to quotes (accept/reject)
CREATE POLICY "Clients can respond to quotes"
ON public.quotes
FOR UPDATE
USING (auth.uid() = client_id);

-- Add trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for quotes
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;