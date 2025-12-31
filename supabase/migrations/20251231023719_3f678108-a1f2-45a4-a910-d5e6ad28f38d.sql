-- Tabela para configuração de disponibilidade semanal do profissional
CREATE TABLE public.professional_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 6 = Sábado
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Tabela para slots de horário disponíveis
CREATE TABLE public.schedule_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.professional_schedules(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Tabela para bloqueios de horários específicos (férias, feriados, compromissos)
CREATE TABLE public.schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME, -- Se NULL, bloqueia o dia inteiro
  end_time TIME, -- Se NULL, bloqueia o dia inteiro
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_block_time CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

-- Índices para performance
CREATE INDEX idx_professional_schedules_user_id ON public.professional_schedules(user_id);
CREATE INDEX idx_schedule_time_slots_schedule_id ON public.schedule_time_slots(schedule_id);
CREATE INDEX idx_schedule_blocks_user_id ON public.schedule_blocks(user_id);
CREATE INDEX idx_schedule_blocks_date ON public.schedule_blocks(block_date);

-- Enable RLS
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies para professional_schedules
CREATE POLICY "Users can view their own schedules"
ON public.professional_schedules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules"
ON public.professional_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
ON public.professional_schedules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
ON public.professional_schedules FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active professional schedules"
ON public.professional_schedules FOR SELECT
USING (is_available = true);

-- RLS Policies para schedule_time_slots
CREATE POLICY "Users can manage their time slots"
ON public.schedule_time_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.professional_schedules ps 
    WHERE ps.id = schedule_time_slots.schedule_id 
    AND ps.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view time slots of available schedules"
ON public.schedule_time_slots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professional_schedules ps 
    WHERE ps.id = schedule_time_slots.schedule_id 
    AND ps.is_available = true
  )
);

-- RLS Policies para schedule_blocks
CREATE POLICY "Users can view their own blocks"
ON public.schedule_blocks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own blocks"
ON public.schedule_blocks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocks"
ON public.schedule_blocks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocks"
ON public.schedule_blocks FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_professional_schedules_updated_at
BEFORE UPDATE ON public.professional_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();