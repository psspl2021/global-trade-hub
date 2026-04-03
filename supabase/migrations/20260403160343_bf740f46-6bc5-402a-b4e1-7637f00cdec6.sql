
CREATE OR REPLACE FUNCTION public.auto_award_expired_auctions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction RECORD;
  v_winning_bid RECORD;
  v_count INT := 0;
BEGIN
  -- Use FOR UPDATE SKIP LOCKED to prevent double-processing
  FOR v_auction IN
    SELECT id, starting_price, quantity, buyer_id, title, product_slug
    FROM public.reverse_auctions
    WHERE status = 'live'
      AND auction_end IS NOT NULL
      AND auction_end <= NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Find L1 (lowest) bid
    SELECT id, supplier_id, bid_price
    INTO v_winning_bid
    FROM public.reverse_auction_bids
    WHERE auction_id = v_auction.id
    ORDER BY bid_price ASC
    LIMIT 1;

    IF v_winning_bid.id IS NOT NULL THEN
      -- Mark winning bid
      UPDATE public.reverse_auction_bids
      SET is_winning = true
      WHERE id = v_winning_bid.id;

      -- Complete auction with winner
      UPDATE public.reverse_auctions
      SET status = 'completed',
          winner_supplier_id = v_winning_bid.supplier_id,
          winning_price = v_winning_bid.bid_price,
          updated_at = NOW()
      WHERE id = v_auction.id;

      -- Audit log
      INSERT INTO public.reverse_auction_audit_logs (auction_id, event_type, actor_id, actor_role, bid_id, bid_amount, metadata)
      VALUES (
        v_auction.id,
        'WINNER_AWARDED',
        v_winning_bid.supplier_id,
        'system',
        v_winning_bid.id,
        v_winning_bid.bid_price,
        jsonb_build_object('auto_awarded', true, 'method', 'auto_close_locked')
      );

      -- Queue winner notification via pg_notify
      PERFORM pg_notify('auction_completed', json_build_object(
        'auction_id', v_auction.id,
        'auction_title', v_auction.title,
        'winner_supplier_id', v_winning_bid.supplier_id,
        'winning_price', v_winning_bid.bid_price,
        'buyer_id', v_auction.buyer_id
      )::text);
    ELSE
      -- No bids — just close
      UPDATE public.reverse_auctions
      SET status = 'completed', updated_at = NOW()
      WHERE id = v_auction.id;
    END IF;

    -- Log completion event
    INSERT INTO public.reverse_auction_audit_logs (auction_id, event_type, actor_id, actor_role, metadata)
    VALUES (
      v_auction.id,
      'AUCTION_COMPLETED',
      'system',
      'system',
      jsonb_build_object('auto_closed', true, 'had_bids', v_winning_bid.id IS NOT NULL)
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
