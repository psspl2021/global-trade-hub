-- Add policy to allow viewing supplier company names publicly (for product listings)
CREATE POLICY "Anyone can view supplier company names" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (SELECT DISTINCT supplier_id FROM products WHERE is_active = true)
);