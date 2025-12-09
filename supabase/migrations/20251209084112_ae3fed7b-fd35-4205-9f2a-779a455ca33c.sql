-- Allow anyone to view profiles (public read for provider profiles)
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);