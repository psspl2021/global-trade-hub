-- Add policy for admins to manage all requirements
CREATE POLICY "Admins can manage all requirements"
ON public.requirements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));