-- Habilitar extensão unaccent
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- Adicionar coluna slug na tabela services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS slug TEXT;

-- Criar índice único para o slug
CREATE UNIQUE INDEX IF NOT EXISTS services_slug_unique ON public.services (slug) WHERE slug IS NOT NULL;

-- Função para gerar slug a partir do título
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Converter para minúsculas e remover acentos
  slug := public.unaccent(lower(title));
  
  -- Substituir espaços e caracteres especiais por hífens
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  
  -- Remover hífens no início e fim
  slug := trim(both '-' from slug);
  
  RETURN slug;
END;
$$;

-- Trigger para gerar slug automaticamente ao inserir/atualizar serviço
CREATE OR REPLACE FUNCTION public.set_service_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gerar slug base a partir do título
  base_slug := generate_slug(NEW.title);
  final_slug := base_slug;
  
  -- Verificar unicidade e adicionar sufixo se necessário
  WHILE EXISTS (SELECT 1 FROM services WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Criar trigger para novos serviços e atualizações de título
DROP TRIGGER IF EXISTS set_service_slug_trigger ON public.services;
CREATE TRIGGER set_service_slug_trigger
BEFORE INSERT OR UPDATE OF title ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.set_service_slug();

-- Atualizar serviços existentes que não têm slug
UPDATE public.services 
SET slug = generate_slug(title) || '-' || LEFT(id::text, 8)
WHERE slug IS NULL;