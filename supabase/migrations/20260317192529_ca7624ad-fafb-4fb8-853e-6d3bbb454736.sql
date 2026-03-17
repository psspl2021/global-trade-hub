
-- Fix: enforce_bid_step with corrected RAISE syntax
CREATE OR REPLACE FUNCTION public.enforce_bid_step()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_lowest numeric;
  min_step numeric;
BEGIN
  SELECT MIN(b.bid_price), a.minimum_bid_step_pct
  INTO current_lowest, min_step
  FROM public.reverse_auction_bids b
  JOIN public.reverse_auctions a ON a.id = NEW.auction_id
  WHERE b.auction_id = NEW.auction_id
  GROUP BY a.minimum_bid_step_pct;

  IF current_lowest IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.bid_price > current_lowest * (1 - (min_step / 100)) THEN
    RAISE EXCEPTION 'Bid must be at least % percent lower than current lowest bid.', min_step;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_bid_step ON reverse_auction_bids;
CREATE TRIGGER trg_enforce_bid_step
BEFORE INSERT ON reverse_auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.enforce_bid_step();
