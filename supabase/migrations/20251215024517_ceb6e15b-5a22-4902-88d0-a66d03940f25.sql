-- Criar tabela para registrar cada visualização com timestamp
CREATE TABLE public.service_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  viewer_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para consultas por service_id e data
CREATE INDEX idx_service_views_service_id ON public.service_views(service_id);
CREATE INDEX idx_service_views_viewed_at ON public.service_views(viewed_at);

-- Habilitar RLS
ALTER TABLE public.service_views ENABLE ROW LEVEL SECURITY;

-- Política: profissionais podem ver visualizações dos seus serviços
CREATE POLICY "Professionals can view their service analytics"
ON public.service_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.services 
    WHERE services.id = service_views.service_id 
    AND services.user_id = auth.uid()
  )
);

-- Atualizar função increment_views para também registrar na tabela de analytics
CREATE OR REPLACE FUNCTION public.increment_views(service_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Incrementar contador no serviço
  UPDATE public.services 
  SET views_count = views_count + 1 
  WHERE id = service_id;
  
  -- Registrar visualização na tabela de analytics
  INSERT INTO public.service_views (service_id, viewer_id)
  VALUES (service_id, auth.uid());
END;
$$;