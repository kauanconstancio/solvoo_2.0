-- Remove the orphaned trigger and function from gamification system
-- The tables were dropped but the trigger/function were left behind

-- First drop the trigger
DROP TRIGGER IF EXISTS trigger_update_professional_stats ON public.quotes;

-- Then drop the function
DROP FUNCTION IF EXISTS public.update_professional_stats_on_service();