-- 1. Adicionar coluna view_date para deduplição
ALTER TABLE public.service_views ADD COLUMN IF NOT EXISTS view_date date DEFAULT CURRENT_DATE;