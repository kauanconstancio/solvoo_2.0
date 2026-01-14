
-- Drop and recreate the function with correct logic
CREATE OR REPLACE FUNCTION public.add_loyalty_points_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  config_record RECORD;
  points_to_add integer;
BEGIN
  -- Trigger when client confirms payment (client_confirmed becomes true)
  -- This happens when payment is completed in the current flow
  IF NEW.client_confirmed = true AND (OLD.client_confirmed IS NULL OR OLD.client_confirmed = false) THEN
    -- Get loyalty config
    SELECT * INTO config_record FROM public.loyalty_config WHERE is_active = true LIMIT 1;
    
    IF config_record IS NOT NULL THEN
      -- Calculate points (points_per_real points per real spent)
      points_to_add := FLOOR(NEW.price * config_record.points_per_real);
      
      IF points_to_add > 0 THEN
        -- Insert or update user points for the CLIENT (who paid)
        INSERT INTO public.user_loyalty_points (user_id, total_points, lifetime_points)
        VALUES (NEW.client_id, points_to_add, points_to_add)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          total_points = user_loyalty_points.total_points + points_to_add,
          lifetime_points = user_loyalty_points.lifetime_points + points_to_add,
          updated_at = now();
        
        -- Record transaction
        INSERT INTO public.loyalty_transactions (user_id, points, type, description, reference_id, reference_type)
        VALUES (NEW.client_id, points_to_add, 'earn', 'Pontos por pagamento: ' || NEW.title, NEW.id, 'quote');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- The trigger already exists, no need to recreate it
