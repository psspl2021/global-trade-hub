
-- ============================================================
-- 1. BID RATE-LIMITING: 1 bid per supplier per 2 seconds
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_bid_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_bid_at TIMESTAMPTZ;
BEGIN
  SELECT created_at INTO v_last_bid_at
  FROM public.reverse_auction_bids
  WHERE auction_id = NEW.auction_id
    AND supplier_id = NEW.supplier_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_bid_at IS NOT NULL AND (NOW() - v_last_bid_at) < INTERVAL '2 seconds' THEN
    RAISE EXCEPTION 'Rate limit: please wait 2 seconds between bids';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bid_rate_limit
BEFORE INSERT ON public.reverse_auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.enforce_bid_rate_limit();

-- ============================================================
-- 2. FRAUD / COLLUSION FLAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auction_fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL,
  supplier_id UUID,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  details JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auction_fraud_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can view fraud flags
CREATE POLICY "Admins can manage fraud flags"
ON public.auction_fraud_flags
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ps_admin'));

-- Fraud detection trigger: flag minimal decrement patterns
CREATE OR REPLACE FUNCTION public.detect_bid_fraud()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev_lowest NUMERIC;
  v_decrement_pct NUMERIC;
  v_supplier_bid_count INT;
BEGIN
  -- Get current lowest bid (before this one)
  SELECT MIN(bid_price) INTO v_prev_lowest
  FROM public.reverse_auction_bids
  WHERE auction_id = NEW.auction_id
    AND id != NEW.id;

  -- Check minimal decrement pattern (< 0.1% reduction = suspicious)
  IF v_prev_lowest IS NOT NULL AND v_prev_lowest > 0 THEN
    v_decrement_pct := ((v_prev_lowest - NEW.bid_price) / v_prev_lowest) * 100;
    
    IF v_decrement_pct > 0 AND v_decrement_pct < 0.1 THEN
      INSERT INTO public.auction_fraud_flags (auction_id, supplier_id, flag_type, severity, details)
      VALUES (
        NEW.auction_id,
        NEW.supplier_id,
        'minimal_decrement',
        'medium',
        jsonb_build_object(
          'bid_id', NEW.id,
          'bid_price', NEW.bid_price,
          'prev_lowest', v_prev_lowest,
          'decrement_pct', ROUND(v_decrement_pct, 4)
        )
      );
    END IF;
  END IF;

  -- Check rapid sequential bidding (>10 bids from same supplier = suspicious)
  SELECT COUNT(*) INTO v_supplier_bid_count
  FROM public.reverse_auction_bids
  WHERE auction_id = NEW.auction_id
    AND supplier_id = NEW.supplier_id;

  IF v_supplier_bid_count > 10 THEN
    INSERT INTO public.auction_fraud_flags (auction_id, supplier_id, flag_type, severity, details)
    VALUES (
      NEW.auction_id,
      NEW.supplier_id,
      'excessive_bids',
      'low',
      jsonb_build_object('bid_count', v_supplier_bid_count, 'bid_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_detect_bid_fraud
AFTER INSERT ON public.reverse_auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.detect_bid_fraud();

-- ============================================================
-- 3. AUTO-AWARD: Server function to close & award expired auctions
-- ============================================================
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
  FOR v_auction IN
    SELECT id, starting_price, quantity
    FROM public.reverse_auctions
    WHERE status = 'live'
      AND auction_end IS NOT NULL
      AND auction_end <= NOW()
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
        jsonb_build_object('auto_awarded', true, 'method', 'auto_close')
      );
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

-- Schedule auto-award every minute via pg_cron
SELECT cron.schedule(
  'auto-award-expired-auctions',
  '* * * * *',
  $$SELECT public.auto_award_expired_auctions()$$
);
