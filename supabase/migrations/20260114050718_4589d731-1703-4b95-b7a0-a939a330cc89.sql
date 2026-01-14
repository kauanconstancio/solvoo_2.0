-- Tabela para configuração do programa de fidelidade
CREATE TABLE public.loyalty_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  points_per_real numeric NOT NULL DEFAULT 1,
  min_points_redemption integer NOT NULL DEFAULT 100,
  point_value_in_reais numeric NOT NULL DEFAULT 0.01,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para saldo de pontos dos usuários
CREATE TABLE public.user_loyalty_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela para histórico de transações de pontos
CREATE TABLE public.loyalty_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'bonus', 'adjustment')),
  description text NOT NULL,
  reference_id uuid NULL,
  reference_type text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para resgates de pontos
CREATE TABLE public.loyalty_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  points_used integer NOT NULL,
  discount_value numeric NOT NULL,
  quote_id uuid NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled', 'expired')),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone NULL
);

-- Enable RLS
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_config
CREATE POLICY "Anyone can view active config" ON public.loyalty_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage config" ON public.loyalty_config
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for user_loyalty_points
CREATE POLICY "Users can view their own points" ON public.user_loyalty_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all points" ON public.user_loyalty_points
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can manage points" ON public.user_loyalty_points
  FOR ALL USING (true);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.loyalty_transactions
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert transactions" ON public.loyalty_transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for loyalty_redemptions
CREATE POLICY "Users can view their own redemptions" ON public.loyalty_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions" ON public.loyalty_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own redemptions" ON public.loyalty_redemptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage redemptions" ON public.loyalty_redemptions
  FOR ALL USING (is_admin(auth.uid()));

-- Insert default config
INSERT INTO public.loyalty_config (points_per_real, min_points_redemption, point_value_in_reais)
VALUES (1, 100, 0.01);

-- Function to add points when quote is completed
CREATE OR REPLACE FUNCTION public.add_loyalty_points_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  config_record RECORD;
  points_to_add integer;
BEGIN
  -- Only process completed quotes
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get loyalty config
    SELECT * INTO config_record FROM public.loyalty_config WHERE is_active = true LIMIT 1;
    
    IF config_record IS NOT NULL THEN
      -- Calculate points (1 point per real by default)
      points_to_add := FLOOR(NEW.price * config_record.points_per_real);
      
      IF points_to_add > 0 THEN
        -- Insert or update user points
        INSERT INTO public.user_loyalty_points (user_id, total_points, lifetime_points)
        VALUES (NEW.client_id, points_to_add, points_to_add)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          total_points = user_loyalty_points.total_points + points_to_add,
          lifetime_points = user_loyalty_points.lifetime_points + points_to_add,
          updated_at = now();
        
        -- Record transaction
        INSERT INTO public.loyalty_transactions (user_id, points, type, description, reference_id, reference_type)
        VALUES (NEW.client_id, points_to_add, 'earn', 'Pontos por serviço: ' || NEW.title, NEW.id, 'quote');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER trigger_add_loyalty_points
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.add_loyalty_points_on_payment();