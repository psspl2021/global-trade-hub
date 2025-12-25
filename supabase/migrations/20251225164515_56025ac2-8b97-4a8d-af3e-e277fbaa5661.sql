-- Allow admins to delete platform invoices
CREATE POLICY "Admins can delete platform invoices"
ON public.platform_invoices
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));