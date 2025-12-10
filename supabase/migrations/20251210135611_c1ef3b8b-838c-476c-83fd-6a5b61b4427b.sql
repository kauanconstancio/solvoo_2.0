-- Create reviews table for service ratings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Authenticated users can create reviews (but not for their own services)
CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  auth.uid() != (SELECT user_id FROM public.services WHERE id = service_id)
);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();