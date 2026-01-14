-- Add new status value 'awaiting_payment' for appointments
-- Update check-booking-payment to confirm appointment after payment

-- First, let's update any existing pending direct bookings that have unpaid quotes
-- to have a clear status indication

-- Add a comment for documentation
COMMENT ON COLUMN public.appointments.status IS 'Status values: pending, awaiting_payment, confirmed, cancelled, completed';

-- Create a function to handle appointment confirmation after payment
CREATE OR REPLACE FUNCTION public.confirm_appointment_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When quote is confirmed (client_confirmed becomes true)
  IF NEW.client_confirmed = true AND (OLD.client_confirmed IS NULL OR OLD.client_confirmed = false) THEN
    -- Update the linked appointment to confirmed status
    UPDATE public.appointments
    SET 
      status = 'confirmed',
      client_confirmed = true,
      updated_at = now()
    WHERE quote_id = NEW.id
      AND status = 'awaiting_payment';
    
    -- Send notification to professional
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      a.professional_id,
      'appointment',
      '✅ Agendamento confirmado!',
      'O cliente pagou e o agendamento foi confirmado para ' || to_char(a.scheduled_date::date, 'DD/MM/YYYY') || ' às ' || a.scheduled_time,
      jsonb_build_object(
        'appointment_id', a.id,
        'service_title', a.title,
        'scheduled_date', a.scheduled_date,
        'scheduled_time', a.scheduled_time
      )
    FROM public.appointments a
    WHERE a.quote_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for payment confirmation
DROP TRIGGER IF EXISTS on_quote_payment_confirmed ON public.quotes;
CREATE TRIGGER on_quote_payment_confirmed
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.confirm_appointment_on_payment();