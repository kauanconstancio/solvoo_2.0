-- Add PIX payment columns to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS pix_id text,
ADD COLUMN IF NOT EXISTS pix_br_code text,
ADD COLUMN IF NOT EXISTS pix_br_code_base64 text,
ADD COLUMN IF NOT EXISTS pix_expires_at timestamp with time zone;