-- Allow admins to update bid items
CREATE POLICY "Admins can update bid items"
ON public.bid_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert bid items (if needed)
CREATE POLICY "Admins can insert bid items"
ON public.bid_items
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete bid items (if needed)
CREATE POLICY "Admins can delete bid items"
ON public.bid_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));