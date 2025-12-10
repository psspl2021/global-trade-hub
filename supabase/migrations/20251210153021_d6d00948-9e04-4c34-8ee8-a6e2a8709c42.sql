-- Remove the overly permissive policy that exposes all profile data to unauthenticated users
DROP POLICY IF EXISTS "Anyone can view basic profile info anon" ON public.profiles;