-- Function to deduct points when redemption is used
CREATE OR REPLACE FUNCTION public.apply_loyalty_redemption()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'applied'
  IF NEW.status = 'applied' AND OLD.status = 'pending' THEN
    -- Deduct points from user
    UPDATE public.user_loyalty_points
    SET 
      total_points = total_points - NEW.points_used,
      updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Record transaction
    INSERT INTO public.loyalty_transactions (user_id, points, type, description, reference_id, reference_type)
    VALUES (NEW.user_id, NEW.points_used, 'redeem', 'Resgate de pontos para desconto', NEW.id, 'redemption');
    
    NEW.used_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER trigger_apply_loyalty_redemption
  BEFORE UPDATE ON public.loyalty_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_loyalty_redemption();

-- Function to return points when redemption is cancelled
CREATE OR REPLACE FUNCTION public.cancel_loyalty_redemption()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'cancelled' from 'pending'
  IF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
    -- No points to return since they weren't deducted yet
    -- Just record the cancellation
    INSERT INTO public.loyalty_transactions (user_id, points, type, description, reference_id, reference_type)
    VALUES (NEW.user_id, 0, 'adjustment', 'Resgate cancelado', NEW.id, 'redemption');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for cancellation
CREATE TRIGGER trigger_cancel_loyalty_redemption
  BEFORE UPDATE ON public.loyalty_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_loyalty_redemption();