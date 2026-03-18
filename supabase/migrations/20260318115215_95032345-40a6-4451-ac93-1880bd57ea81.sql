
-- Update close_expired_auctions to trigger notification emails via pg_net
CREATE OR REPLACE FUNCTION public.close_expired_auctions()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  auction RECORD;
  lowest_bid RECORD;
  edge_function_url text;
  anon_key text;
BEGIN
  -- Construct the edge function URL
  edge_function_url := 'https://hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/send-auction-result';

  FOR auction IN
    SELECT *
    FROM reverse_auctions
    WHERE status = 'live'
    AND auction_end <= now()
  LOOP
    -- Get lowest bid
    SELECT supplier_id, bid_price
    INTO lowest_bid
    FROM reverse_auction_bids
    WHERE auction_id = auction.id
    ORDER BY bid_price ASC
    LIMIT 1;

    IF lowest_bid IS NOT NULL THEN
      -- Mark auction as completed with winner
      UPDATE reverse_auctions
      SET
        status = 'completed',
        winner_supplier_id = lowest_bid.supplier_id,
        winning_bid = lowest_bid.bid_price,
        updated_at = now()
      WHERE id = auction.id;

      -- Trigger email notifications via edge function
      PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'auction_id', auction.id
        )
      );
    ELSE
      -- No bids — mark as cancelled
      UPDATE reverse_auctions
      SET
        status = 'cancelled',
        updated_at = now()
      WHERE id = auction.id;
    END IF;
  END LOOP;
END;
$$;
