
-- =============================================
-- FASE 1: REMOVER SISTEMA DE FIDELIDADE ANTIGO
-- =============================================

-- Remover triggers primeiro
DROP TRIGGER IF EXISTS trigger_add_loyalty_points ON public.quotes;
DROP TRIGGER IF EXISTS trigger_apply_loyalty_redemption ON public.loyalty_redemptions;
DROP TRIGGER IF EXISTS trigger_cancel_loyalty_redemption ON public.loyalty_redemptions;

-- Remover functions
DROP FUNCTION IF EXISTS public.add_loyalty_points_on_payment();
DROP FUNCTION IF EXISTS public.apply_loyalty_redemption();
DROP FUNCTION IF EXISTS public.cancel_loyalty_redemption();

-- Remover tabelas (ordem importa por causa de foreign keys)
DROP TABLE IF EXISTS public.loyalty_redemptions;
DROP TABLE IF EXISTS public.loyalty_transactions;
DROP TABLE IF EXISTS public.user_loyalty_points;
DROP TABLE IF EXISTS public.loyalty_config;

-- =============================================
-- FASE 2: CRIAR SISTEMA DE GAMIFICAÇÃO
-- =============================================

-- Configuração de níveis (definidos pelos admins)
CREATE TABLE public.professional_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  min_revenue numeric NOT NULL DEFAULT 0,
  min_services integer NOT NULL DEFAULT 0,
  icon_url text,
  color text NOT NULL DEFAULT '#CD7F32',
  benefits jsonb DEFAULT '[]'::jsonb,
  commission_discount numeric DEFAULT 0,
  priority_boost integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Estatísticas do profissional
CREATE TABLE public.professional_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_services integer NOT NULL DEFAULT 0,
  current_level_id uuid REFERENCES public.professional_levels(id),
  current_month_revenue numeric NOT NULL DEFAULT 0,
  current_month_services integer NOT NULL DEFAULT 0,
  best_month_revenue numeric NOT NULL DEFAULT 0,
  streak_months integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conquistas/Badges
CREATE TABLE public.professional_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'trophy',
  requirement_type text NOT NULL,
  requirement_value numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Badges conquistados
CREATE TABLE public.professional_badge_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.professional_badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Metas/Desafios
CREATE TABLE public.professional_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  goal_type text NOT NULL,
  target_value numeric NOT NULL,
  reward_type text,
  reward_value text,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Progresso nas metas
CREATE TABLE public.professional_goal_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL REFERENCES public.professional_goals(id) ON DELETE CASCADE,
  current_value numeric DEFAULT 0,
  completed_at timestamptz,
  reward_claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, goal_id)
);

-- Histórico de conquistas
CREATE TABLE public.professional_achievements_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- HABILITAR RLS
-- =============================================

ALTER TABLE public.professional_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_achievements_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS
-- =============================================

-- Níveis: todos podem ler, admins podem gerenciar
CREATE POLICY "Anyone can read levels" ON public.professional_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage levels" ON public.professional_levels FOR ALL USING (public.has_any_role(auth.uid()));

-- Stats: profissionais veem suas próprias, admins veem todas
CREATE POLICY "Professionals can view own stats" ON public.professional_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all stats" ON public.professional_stats FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "System can manage stats" ON public.professional_stats FOR ALL USING (public.has_any_role(auth.uid()));

-- Badges: todos podem ler, admins gerenciam
CREATE POLICY "Anyone can read badges" ON public.professional_badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.professional_badges FOR ALL USING (public.has_any_role(auth.uid()));

-- Badge awards: profissionais veem suas, admins veem todas
CREATE POLICY "Professionals can view own badge awards" ON public.professional_badge_awards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all badge awards" ON public.professional_badge_awards FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "System can manage badge awards" ON public.professional_badge_awards FOR ALL USING (public.has_any_role(auth.uid()));

-- Goals: todos podem ler ativas, admins gerenciam
CREATE POLICY "Anyone can read active goals" ON public.professional_goals FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage goals" ON public.professional_goals FOR ALL USING (public.has_any_role(auth.uid()));

-- Goal progress: profissionais veem seu progresso
CREATE POLICY "Professionals can view own goal progress" ON public.professional_goal_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Professionals can update own goal progress" ON public.professional_goal_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage goal progress" ON public.professional_goal_progress FOR ALL USING (public.has_any_role(auth.uid()));

-- Achievements log: profissionais veem seu histórico
CREATE POLICY "Professionals can view own achievements" ON public.professional_achievements_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage achievements" ON public.professional_achievements_log FOR ALL USING (public.has_any_role(auth.uid()));

-- =============================================
-- FUNÇÃO PARA ATUALIZAR STATS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_professional_stats_on_service()
RETURNS TRIGGER AS $$
DECLARE
  new_level_id uuid;
  old_level_id uuid;
  current_stats RECORD;
BEGIN
  -- Only trigger when client confirms payment
  IF NEW.client_confirmed = true AND (OLD.client_confirmed IS NULL OR OLD.client_confirmed = false) THEN
    
    -- Get or create stats record
    INSERT INTO public.professional_stats (user_id, total_revenue, total_services, current_month_revenue, current_month_services)
    VALUES (NEW.professional_id, NEW.price, 1, NEW.price, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_revenue = professional_stats.total_revenue + NEW.price,
      total_services = professional_stats.total_services + 1,
      current_month_revenue = CASE 
        WHEN date_trunc('month', now()) = date_trunc('month', professional_stats.updated_at)
        THEN professional_stats.current_month_revenue + NEW.price
        ELSE NEW.price
      END,
      current_month_services = CASE
        WHEN date_trunc('month', now()) = date_trunc('month', professional_stats.updated_at)
        THEN professional_stats.current_month_services + 1
        ELSE 1
      END,
      best_month_revenue = GREATEST(
        professional_stats.best_month_revenue,
        CASE 
          WHEN date_trunc('month', now()) = date_trunc('month', professional_stats.updated_at)
          THEN professional_stats.current_month_revenue + NEW.price
          ELSE NEW.price
        END
      ),
      updated_at = now()
    RETURNING * INTO current_stats;
    
    -- Find appropriate level based on total revenue
    SELECT id INTO new_level_id
    FROM public.professional_levels
    WHERE min_revenue <= current_stats.total_revenue
    ORDER BY min_revenue DESC
    LIMIT 1;
    
    -- Update level if changed
    IF new_level_id IS NOT NULL AND (current_stats.current_level_id IS NULL OR current_stats.current_level_id != new_level_id) THEN
      old_level_id := current_stats.current_level_id;
      
      UPDATE public.professional_stats
      SET current_level_id = new_level_id
      WHERE user_id = NEW.professional_id;
      
      -- Log level up achievement
      INSERT INTO public.professional_achievements_log (user_id, type, title, description, data)
      SELECT 
        NEW.professional_id,
        'level_up',
        'Subiu para ' || l.name || '!',
        'Parabéns! Você alcançou o nível ' || l.name,
        jsonb_build_object('level_id', new_level_id, 'level_name', l.name)
      FROM public.professional_levels l
      WHERE l.id = new_level_id;
      
      -- Create notification
      INSERT INTO public.notifications (user_id, type, title, message, data)
      SELECT
        NEW.professional_id,
        'level_up',
        '🏆 Você subiu de nível!',
        'Parabéns! Você alcançou o nível ' || l.name || '!',
        jsonb_build_object('level_id', new_level_id, 'level_name', l.name, 'color', l.color)
      FROM public.professional_levels l
      WHERE l.id = new_level_id;
    END IF;
    
    -- Log service completion
    INSERT INTO public.professional_achievements_log (user_id, type, title, description, data)
    VALUES (
      NEW.professional_id,
      'service_completed',
      'Serviço concluído',
      'Serviço "' || NEW.title || '" foi pago',
      jsonb_build_object('quote_id', NEW.id, 'amount', NEW.price)
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar stats
CREATE TRIGGER trigger_update_professional_stats
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_stats_on_service();

-- =============================================
-- INSERIR NÍVEIS PADRÃO
-- =============================================

INSERT INTO public.professional_levels (name, slug, min_revenue, min_services, color, benefits, commission_discount, sort_order) VALUES
('Bronze', 'bronze', 0, 0, '#CD7F32', '["Badge Bronze no perfil"]', 0, 1),
('Prata', 'prata', 1000, 10, '#C0C0C0', '["Badge Prata no perfil", "-1% na taxa da plataforma"]', 1, 2),
('Ouro', 'ouro', 5000, 30, '#FFD700', '["Badge Ouro no perfil", "-2% na taxa da plataforma", "Destaque na busca"]', 2, 3),
('Diamante', 'diamante', 20000, 100, '#B9F2FF', '["Badge Diamante no perfil", "-3% na taxa da plataforma", "Destaque premium", "Selo verificado"]', 3, 4),
('Black', 'black', 50000, 250, '#1a1a2e', '["Badge Black exclusivo", "-5% na taxa da plataforma", "Suporte prioritário", "Destaque máximo"]', 5, 5);

-- =============================================
-- INSERIR BADGES PADRÃO
-- =============================================

INSERT INTO public.professional_badges (name, description, icon, requirement_type, requirement_value) VALUES
('Primeira Venda', 'Completou sua primeira venda na plataforma', 'rocket', 'services', 1),
('Vendedor Iniciante', 'Completou 5 serviços', 'star', 'services', 5),
('Vendedor Experiente', 'Completou 25 serviços', 'award', 'services', 25),
('Vendedor Expert', 'Completou 100 serviços', 'crown', 'services', 100),
('R$ 500 em Vendas', 'Faturou R$ 500 na plataforma', 'coins', 'revenue', 500),
('R$ 2.000 em Vendas', 'Faturou R$ 2.000 na plataforma', 'banknote', 'revenue', 2000),
('R$ 10.000 em Vendas', 'Faturou R$ 10.000 na plataforma', 'gem', 'revenue', 10000),
('Avaliação 5 Estrelas', 'Recebeu uma avaliação 5 estrelas', 'sparkles', 'rating', 5);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_professional_stats_user_id ON public.professional_stats(user_id);
CREATE INDEX idx_professional_stats_total_revenue ON public.professional_stats(total_revenue DESC);
CREATE INDEX idx_professional_badge_awards_user_id ON public.professional_badge_awards(user_id);
CREATE INDEX idx_professional_goal_progress_user_id ON public.professional_goal_progress(user_id);
CREATE INDEX idx_professional_achievements_log_user_id ON public.professional_achievements_log(user_id);
