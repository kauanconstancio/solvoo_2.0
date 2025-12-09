-- Add foreign key relationship between services and profiles
ALTER TABLE public.services 
ADD CONSTRAINT services_user_id_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;