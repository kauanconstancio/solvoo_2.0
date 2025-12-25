-- Add response columns to reviews table
ALTER TABLE public.reviews
ADD COLUMN response_text TEXT,
ADD COLUMN response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN responded_by UUID;

-- Add comment for documentation
COMMENT ON COLUMN public.reviews.response_text IS 'Professional response to the review';
COMMENT ON COLUMN public.reviews.response_at IS 'When the professional responded';
COMMENT ON COLUMN public.reviews.responded_by IS 'User ID of the professional who responded';