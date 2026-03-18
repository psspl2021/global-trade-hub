
-- Add missing column
ALTER TABLE reverse_auctions ADD COLUMN IF NOT EXISTS winning_bid numeric;

-- Function to close expired auctions and pick winner
CREATE OR REPLACE FUNCTION public.close_expired_auctions()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  auction RECORD;
  lowest_bid RECORD;
BEGIN
  FOR auction IN
    SELECT * FROM reverse_auctions
    WHERE status = 'live' AND auction_end <= now()
  LOOP
    SELECT supplier_id, bid_price INTO lowest_bid
    FROM reverse_auction_bids
    WHERE auction_id = auction.id
    ORDER BY bid_price ASC LIMIT 1;

    IF lowest_bid IS NOT NULL THEN
      UPDATE reverse_auctions
      SET status = 'completed',
          winner_supplier_id = lowest_bid.supplier_id,
          winning_bid = lowest_bid.bid_price,
          updated_at = now()
      WHERE id = auction.id;
    ELSE
      UPDATE reverse_auctions
      SET status = 'cancelled', updated_at = now()
      WHERE id = auction.id;
    END IF;
  END LOOP;
END;
$$;

-- Prevent bids after auction end
CREATE OR REPLACE FUNCTION public.prevent_bids_after_end()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  auction_end_time timestamptz;
BEGIN
  SELECT auction_end INTO auction_end_time
  FROM reverse_auctions WHERE id = NEW.auction_id;

  IF auction_end_time <= now() THEN
    RAISE EXCEPTION 'Auction has already ended';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_bids_after_end ON reverse_auction_bids;

CREATE TRIGGER trg_prevent_bids_after_end
BEFORE INSERT ON reverse_auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.prevent_bids_after_end();
