-- Update increment_views function with rate limiting
-- Only count one view per user per service per 24 hours
CREATE OR REPLACE FUNCTION public.increment_views(service_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  viewer uuid := auth.uid();
  last_view_time timestamptz;
BEGIN
  -- Check if this viewer already viewed this service in the last 24 hours
  IF viewer IS NOT NULL THEN
    SELECT viewed_at INTO last_view_time
    FROM public.service_views
    WHERE service_views.service_id = increment_views.service_id
      AND viewer_id = viewer
    ORDER BY viewed_at DESC
    LIMIT 1;
    
    -- If viewed within last 24 hours, skip
    IF last_view_time IS NOT NULL AND last_view_time > now() - interval '24 hours' THEN
      RETURN;
    END IF;
  ELSE
    -- For anonymous users, we still record the view but can't rate limit effectively
    -- Consider using session ID or IP in the future via edge function
    NULL;
  END IF;
  
  -- Increment counter on service
  UPDATE public.services 
  SET views_count = views_count + 1 
  WHERE id = increment_views.service_id;
  
  -- Record view in analytics table
  INSERT INTO public.service_views (service_id, viewer_id)
  VALUES (increment_views.service_id, viewer);
END;
$function$;

-- Add index for faster lookups on rate limiting queries
CREATE INDEX IF NOT EXISTS idx_service_views_rate_limit 
ON public.service_views (service_id, viewer_id, viewed_at DESC);