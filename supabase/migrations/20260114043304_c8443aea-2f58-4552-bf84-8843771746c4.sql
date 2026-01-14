-- Create coupons table for admin-managed discount coupons
CREATE TABLE public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    max_uses INTEGER,
    uses_count INTEGER NOT NULL DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon usage tracking table
CREATE TABLE public.coupon_usages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    quote_id UUID REFERENCES public.quotes(id),
    discount_amount NUMERIC NOT NULL
);

-- Create service promotions table for professionals
CREATE TABLE public.service_promotions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL,
    original_price TEXT NOT NULL,
    promotional_price TEXT NOT NULL,
    discount_percentage NUMERIC,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service history table for clients
CREATE TABLE public.service_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    service_id UUID REFERENCES public.services(id),
    professional_id UUID NOT NULL,
    quote_id UUID REFERENCES public.quotes(id),
    appointment_id UUID REFERENCES public.appointments(id),
    service_title TEXT NOT NULL,
    service_category TEXT,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mass notifications table
CREATE TABLE public.mass_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'clients', 'professionals', 'segment')),
    target_segment JSONB,
    sent_by UUID NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    recipients_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- RLS Policies for coupon_usages
CREATE POLICY "Admins can view all usages" ON public.coupon_usages FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can view their own usages" ON public.coupon_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own usages" ON public.coupon_usages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for service_promotions
CREATE POLICY "Anyone can view active promotions" ON public.service_promotions FOR SELECT USING (is_active = true AND ends_at > now());
CREATE POLICY "Professionals can manage their promotions" ON public.service_promotions FOR ALL USING (auth.uid() = professional_id);

-- RLS Policies for service_history
CREATE POLICY "Users can view their own history" ON public.service_history FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Professionals can view services they provided" ON public.service_history FOR SELECT USING (auth.uid() = professional_id);
CREATE POLICY "System can create history" ON public.service_history FOR INSERT WITH CHECK (true);

-- RLS Policies for mass_notifications
CREATE POLICY "Admins can manage mass notifications" ON public.mass_notifications FOR ALL USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_promotions_updated_at BEFORE UPDATE ON public.service_promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();