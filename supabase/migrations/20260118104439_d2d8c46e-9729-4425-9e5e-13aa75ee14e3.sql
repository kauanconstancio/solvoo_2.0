-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a public view that only exposes safe fields
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  bio,
  account_type,
  city,
  state,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Create policy for public to access only through the view
-- Users can still see their own full profile
CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all profiles for management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));