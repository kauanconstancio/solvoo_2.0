-- Allow clients to also create appointments
DROP POLICY IF EXISTS "Professionals can create appointments" ON public.appointments;

CREATE POLICY "Users can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = professional_id OR auth.uid() = client_id);