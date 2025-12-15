-- Criar função RPC para incrementar visualizações de forma segura
CREATE OR REPLACE FUNCTION public.increment_views(service_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.services 
  SET views_count = views_count + 1 
  WHERE id = service_id;
END;
$$;