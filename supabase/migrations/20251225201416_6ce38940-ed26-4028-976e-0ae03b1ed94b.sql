-- Drop existing restrictive anonymous policy
DROP POLICY IF EXISTS "Anyone can view active requirements anon" ON public.requirements;

-- Create new policy that allows anyone to view all requirements (for public RFQ listing page)
CREATE POLICY "Anyone can view all requirements anon" 
ON public.requirements 
FOR SELECT 
USING (true);