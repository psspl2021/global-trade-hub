-- Add RLS policy for admin to view all profiles (for signup data export)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add RLS policy for admin to view all bids
CREATE POLICY "Admins can view all bids"
ON public.bids
FOR SELECT
USING (has_role(auth.uid(), 'admin'));