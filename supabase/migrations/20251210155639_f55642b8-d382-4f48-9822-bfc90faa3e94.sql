-- Allow anyone to count supplier and logistics partner roles for the early adopter banner
-- This is safe because user_roles only contains user_id (UUID) and role - no PII
CREATE POLICY "Anyone can view supplier and logistics partner role counts"
ON public.user_roles
FOR SELECT
USING (role IN ('supplier', 'logistics_partner'));