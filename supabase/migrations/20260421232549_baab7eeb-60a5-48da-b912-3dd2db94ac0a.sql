CREATE POLICY "Buyers manage items on own POs"
ON public.po_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = po_items.po_id
      AND (po.created_by = auth.uid() OR po.purchaser_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = po_items.po_id
      AND (po.created_by = auth.uid() OR po.purchaser_id = auth.uid())
  )
);