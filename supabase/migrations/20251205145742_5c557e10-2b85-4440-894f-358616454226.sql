-- Drop the overly permissive INSERT policy that allows any authenticated user to create invoices
DROP POLICY IF EXISTS "System can insert platform invoices" ON platform_invoices;

-- Platform invoices should only be created by:
-- 1. The database trigger (create_service_fee_invoice) which runs as SECURITY DEFINER
-- 2. Admin users for manual corrections if needed
CREATE POLICY "Admins can insert platform invoices"
ON platform_invoices FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));