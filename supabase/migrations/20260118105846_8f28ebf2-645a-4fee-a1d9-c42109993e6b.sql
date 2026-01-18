-- Create table for API rate limiting
CREATE TABLE public.api_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  function_name TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index for fast lookups
CREATE UNIQUE INDEX idx_rate_limits_identifier_function 
ON public.api_rate_limits (identifier, function_name, window_start);

-- Create index for cleanup
CREATE INDEX idx_rate_limits_window_start 
ON public.api_rate_limits (window_start);

-- Enable RLS (allow service role only)
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access
-- This ensures the table is only accessible via edge functions

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_function_name TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
BEGIN
  -- Calculate window start (rounded to the minute)
  v_window_start := date_trunc('minute', now()) - 
    (EXTRACT(MINUTE FROM now())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
  
  -- Try to insert or update
  INSERT INTO public.api_rate_limits (identifier, function_name, request_count, window_start)
  VALUES (p_identifier, p_function_name, 1, v_window_start)
  ON CONFLICT (identifier, function_name, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  -- Return true if under limit, false if over
  RETURN v_current_count <= p_max_requests;
END;
$$;

-- Function to clean up old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;