-- Add policy for admins to manage all requirement items
CREATE POLICY "Admins can manage all requirement items"
ON public.requirement_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));