-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  max_services INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- Admins can view all plans
CREATE POLICY "Admins can view all plans"
ON public.subscription_plans
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert plans
CREATE POLICY "Admins can insert plans"
ON public.subscription_plans
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update plans
CREATE POLICY "Admins can update plans"
ON public.subscription_plans
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete plans
CREATE POLICY "Admins can delete plans"
ON public.subscription_plans
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_subscriptions table to track user subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update subscriptions
CREATE POLICY "Admins can update subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, description, price, features, is_active, is_popular, display_order, max_services) VALUES
('Básico', 'basico', 'Ideal para começar', 0, '["Até 5 anúncios ativos", "Perfil básico", "Chat com clientes", "Suporte por email"]', true, false, 1, 5),
('Profissional', 'profissional', 'Para profissionais em crescimento', 49, '["Anúncios ilimitados", "Perfil verificado", "Destaque nas buscas", "Análises avançadas", "Suporte prioritário", "Selo de profissional"]', true, true, 2, null),
('Premium', 'premium', 'Máxima visibilidade', 99, '["Tudo do Profissional", "Posição premium nas buscas", "Campanhas promocionais", "Gerente de conta dedicado", "API para integrações", "Relatórios personalizados"]', true, false, 3, null);