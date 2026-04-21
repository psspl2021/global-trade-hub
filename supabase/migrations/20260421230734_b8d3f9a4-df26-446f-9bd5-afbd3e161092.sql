-- Allow authenticated buyers to create their own POs (auction-derived or manual)
CREATE POLICY "Buyers can create own purchase orders"
ON public.purchase_orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  OR auth.uid() = purchaser_id
);

-- Allow buyers to update POs they created (so dispatch/delivery flows work)
CREATE POLICY "Buyers can update own purchase orders"
ON public.purchase_orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR auth.uid() = purchaser_id
)
WITH CHECK (
  auth.uid() = created_by
  OR auth.uid() = purchaser_id
);

-- Allow buyers to view POs they created
CREATE POLICY "Buyers can view own purchase orders"
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR auth.uid() = purchaser_id
);