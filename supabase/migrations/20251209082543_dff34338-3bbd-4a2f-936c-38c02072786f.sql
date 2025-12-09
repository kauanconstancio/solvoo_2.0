-- Create services table for storing professional service listings
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'fixed',
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  phone TEXT,
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  verified BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active services
CREATE POLICY "Anyone can view active services"
ON public.services
FOR SELECT
USING (status = 'active');

-- Policy: Users can view their own services (any status)
CREATE POLICY "Users can view their own services"
ON public.services
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own services
CREATE POLICY "Users can create their own services"
ON public.services
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own services
CREATE POLICY "Users can update their own services"
ON public.services
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own services
CREATE POLICY "Users can delete their own services"
ON public.services
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();