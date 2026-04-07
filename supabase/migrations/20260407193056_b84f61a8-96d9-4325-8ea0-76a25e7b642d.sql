-- Add a simpler read policy for auction items: any authenticated user can view items
-- (items are non-sensitive product specs, not confidential data)
CREATE POLICY "Authenticated users can view auction items"
ON public.reverse_auction_items
FOR SELECT
TO authenticated
USING (true);
