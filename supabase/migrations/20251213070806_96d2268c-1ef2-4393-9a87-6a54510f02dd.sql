-- Add favorites_count column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS favorites_count integer NOT NULL DEFAULT 0;

-- Create function to increment favorites count
CREATE OR REPLACE FUNCTION public.increment_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.services 
  SET favorites_count = favorites_count + 1 
  WHERE id::text = NEW.service_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to decrement favorites count
CREATE OR REPLACE FUNCTION public.decrement_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.services 
  SET favorites_count = GREATEST(favorites_count - 1, 0)
  WHERE id::text = OLD.service_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for when a favorite is added
CREATE TRIGGER on_favorite_added
AFTER INSERT ON public.favorites
FOR EACH ROW
EXECUTE FUNCTION public.increment_favorites_count();

-- Create trigger for when a favorite is removed
CREATE TRIGGER on_favorite_removed
AFTER DELETE ON public.favorites
FOR EACH ROW
EXECUTE FUNCTION public.decrement_favorites_count();

-- Update existing favorites counts
UPDATE public.services s
SET favorites_count = (
  SELECT COUNT(*) FROM public.favorites f WHERE f.service_id = s.id::text
);