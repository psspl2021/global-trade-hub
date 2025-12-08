-- Allow anonymous users to view active requirements
CREATE POLICY "Anyone can view active requirements anon"
ON public.requirements
FOR SELECT
TO anon
USING (status = 'active'::requirement_status);

-- Allow anonymous users to view basic profile info (company names are masked in UI)
CREATE POLICY "Anyone can view basic profile info anon"
ON public.profiles
FOR SELECT
TO anon
USING (true);