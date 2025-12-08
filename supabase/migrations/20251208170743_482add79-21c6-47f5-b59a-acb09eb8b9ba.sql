-- Add RLS policy for anonymous users to view requirement items for active requirements
CREATE POLICY "Anyone can view requirement items for active requirements anon"
ON public.requirement_items
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM requirements r 
    WHERE r.id = requirement_items.requirement_id 
    AND r.status = 'active'::requirement_status
  )
);