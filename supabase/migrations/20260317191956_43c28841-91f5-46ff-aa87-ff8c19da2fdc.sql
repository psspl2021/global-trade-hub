
-- STEP 1: Strict bid ownership + invite check (replaces existing)
DROP POLICY IF EXISTS "Suppliers place bids" ON reverse_auction_bids;
CREATE POLICY "Suppliers place bids"
ON reverse_auction_bids
FOR INSERT
WITH CHECK (
  supplier_id = auth.uid()
  AND public.can_supplier_access_auction(auction_id, auth.uid(), auth.jwt() ->> 'email')
);

-- STEP 2: Block bid updates and deletes (immutable audit trail)
DROP POLICY IF EXISTS "Suppliers update bids" ON reverse_auction_bids;
CREATE POLICY "Suppliers update bids"
ON reverse_auction_bids
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Suppliers delete bids" ON reverse_auction_bids;
CREATE POLICY "Suppliers delete bids"
ON reverse_auction_bids
FOR DELETE
USING (false);

-- STEP 3: Anti-spam trigger (2s cooldown per supplier per auction)
CREATE OR REPLACE FUNCTION public.prevent_bid_spam()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reverse_auction_bids
    WHERE auction_id = NEW.auction_id
      AND supplier_id = NEW.supplier_id
      AND created_at > now() - interval '2 seconds'
  ) THEN
    RAISE EXCEPTION 'Too many bids, please wait';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_bid_spam ON reverse_auction_bids;
CREATE TRIGGER trg_prevent_bid_spam
BEFORE INSERT ON reverse_auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.prevent_bid_spam();
