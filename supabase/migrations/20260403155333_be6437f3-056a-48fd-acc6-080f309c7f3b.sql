
CREATE OR REPLACE FUNCTION public.handle_anti_snipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction RECORD;
  v_remaining_seconds NUMERIC;
  v_new_end TIMESTAMPTZ;
BEGIN
  -- Fetch the auction details
  SELECT id, auction_end, anti_snipe_seconds, anti_snipe_threshold_seconds, status
  INTO v_auction
  FROM public.reverse_auctions
  WHERE id = NEW.auction_id;

  -- Only apply to live auctions with an end time
  IF v_auction.status != 'live' OR v_auction.auction_end IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate remaining seconds
  v_remaining_seconds := EXTRACT(EPOCH FROM (v_auction.auction_end - NOW()));

  -- Check if we're within the anti-snipe threshold
  IF v_remaining_seconds > 0 AND v_remaining_seconds < COALESCE(v_auction.anti_snipe_threshold_seconds, 60) THEN
    v_new_end := v_auction.auction_end + (COALESCE(v_auction.anti_snipe_seconds, 120) * INTERVAL '1 second');

    -- Extend the auction
    UPDATE public.reverse_auctions
    SET auction_end = v_new_end, updated_at = NOW()
    WHERE id = NEW.auction_id;

    -- Log the anti-snipe event
    INSERT INTO public.reverse_auction_audit_logs (auction_id, event_type, actor_id, actor_role, bid_amount, metadata)
    VALUES (
      NEW.auction_id,
      'ANTI_SNIPE_TRIGGERED',
      NEW.supplier_id,
      'system',
      NEW.bid_price,
      jsonb_build_object(
        'old_end', v_auction.auction_end,
        'new_end', v_new_end,
        'extension_seconds', COALESCE(v_auction.anti_snipe_seconds, 120),
        'remaining_seconds_at_bid', v_remaining_seconds
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_anti_snipe_on_bid
AFTER INSERT ON public.reverse_auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_anti_snipe();
