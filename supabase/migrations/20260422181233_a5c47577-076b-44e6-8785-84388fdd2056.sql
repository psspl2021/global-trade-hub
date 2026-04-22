CREATE OR REPLACE FUNCTION public.close_expired_auctions()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  auction RECORD;
  lowest_bid RECORD;
BEGIN
  -- First, promote any 'scheduled' auctions whose start time has passed to 'live'
  UPDATE reverse_auctions
  SET status = 'live', updated_at = now()
  WHERE status = 'scheduled'
    AND auction_start <= now()
    AND auction_end > now();

  -- Then close any auction (live OR still-scheduled-but-past-end) whose end time has passed
  FOR auction IN
    SELECT *
    FROM reverse_auctions
    WHERE status IN ('live', 'scheduled')
      AND auction_end <= now()
      AND (result_notified = false OR result_notified IS NULL)
  LOOP
    SELECT supplier_id, bid_price
    INTO lowest_bid
    FROM reverse_auction_bids
    WHERE auction_id = auction.id
    ORDER BY bid_price ASC
    LIMIT 1;

    IF lowest_bid IS NOT NULL THEN
      UPDATE reverse_auctions
      SET
        status = 'completed',
        winner_supplier_id = lowest_bid.supplier_id,
        winning_bid = lowest_bid.bid_price,
        result_notified = true,
        updated_at = now()
      WHERE id = auction.id;

      PERFORM net.http_post(
        url := 'https://hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/send-auction-result',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeWJoamp0eGR3dHBmdmNtb3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTkyNDgsImV4cCI6MjA3OTkzNTI0OH0.fesTj_quA4mflT0_pICjqlSbJRJQ0EbQDaitx-H78_U'
        ),
        body := jsonb_build_object(
          'auction_id', auction.id
        )
      );
    ELSE
      UPDATE reverse_auctions
      SET status = 'cancelled',
          result_notified = true,
          updated_at = now()
      WHERE id = auction.id;
    END IF;
  END LOOP;
END;
$function$;

-- One-time cleanup: process any auctions currently stuck past their end time
SELECT public.close_expired_auctions();