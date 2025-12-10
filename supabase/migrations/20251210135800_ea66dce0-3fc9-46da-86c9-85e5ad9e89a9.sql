-- Add foreign key relationship between reviews and profiles for the join query
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_user_id_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;