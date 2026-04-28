
-- ============================================================
-- Bug 1: Allow cron-driven (no auth.uid()) trusted state mutations
-- ============================================================
CREATE OR REPLACE FUNCTION public._is_trusted_state_mutation(_required_cap text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bypass text;
  v_cron_bypass text;
BEGIN
  -- Cron / system bypass (no auth.uid present). Set explicitly by trusted
  -- SECURITY DEFINER functions like close_expired_auctions().
  v_cron_bypass := current_setting('app.bypass_state_guard_cron', true);
  IF v_cron_bypass = 'true' AND auth.uid() IS NULL THEN
    RETURN true;
  END IF;

  v_bypass := current_setting('app.bypass_state_guard', true);
  IF v_bypass IS NULL OR v_bypass <> 'true' THEN
    RETURN false;
  END IF;
  -- Even with the bypass flag, the caller's auth.uid() must hold the capability.
  RETURN public.has_capability(auth.uid(), _required_cap);
END;
$function$;

-- ============================================================
-- Bug 1: Rewrite close_expired_auctions to use the trusted bypass
-- and write winning_price (not winning_bid)
-- ============================================================
CREATE OR REPLACE FUNCTION public.close_expired_auctions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  auction RECORD;
  lowest_bid RECORD;
BEGIN
  -- Trusted cron bypass for guard triggers (transaction-local)
  PERFORM set_config('app.bypass_state_guard_cron', 'true', true);

  -- Promote scheduled -> live where the start time has passed
  UPDATE reverse_auctions
  SET status = 'live', updated_at = now()
  WHERE status = 'scheduled'
    AND auction_start <= now()
    AND auction_end > now();

  -- Close any auction whose end time has passed
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

    IF lowest_bid.supplier_id IS NOT NULL THEN
      -- Mark winning bid (best-effort; column may not exist in older deploys)
      BEGIN
        UPDATE reverse_auction_bids
        SET is_winning = true
        WHERE auction_id = auction.id AND supplier_id = lowest_bid.supplier_id
          AND bid_price = lowest_bid.bid_price;
      EXCEPTION WHEN undefined_column THEN
        NULL;
      END;

      UPDATE reverse_auctions
      SET status = 'completed',
          winner_supplier_id = lowest_bid.supplier_id,
          winning_price = lowest_bid.bid_price,
          result_notified = true,
          updated_at = now()
      WHERE id = auction.id;

      PERFORM net.http_post(
        url := 'https://hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/send-auction-result',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeWJoamp0eGR3dHBmdmNtb3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTkyNDgsImV4cCI6MjA3OTkzNTI0OH0.fesTj_quA4mflT0_pICjqlSbJRJQ0EbQDaitx-H78_U'
        ),
        body := jsonb_build_object('auction_id', auction.id)
      );
    ELSE
      UPDATE reverse_auctions
      SET status = 'cancelled',
          result_notified = true,
          updated_at = now()
      WHERE id = auction.id;
    END IF;
  END LOOP;

  PERFORM set_config('app.bypass_state_guard_cron', 'false', true);
END;
$function$;

-- ============================================================
-- Bug 2: Allow null next_retry_at for terminally failed rows
-- ============================================================
ALTER TABLE public.erp_sync_queue
  ALTER COLUMN next_retry_at DROP NOT NULL;

-- ============================================================
-- Bug 3: Secure RPC for anonymous demand signal capture
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_demand_signal(
  p_signal_source text,
  p_category text,
  p_country text,
  p_classification text,
  p_intent_score numeric,
  p_confidence_score numeric,
  p_lane_state text,
  p_subcategory text DEFAULT NULL,
  p_buyer_type text DEFAULT 'unknown_external',
  p_decision_action text DEFAULT 'pending',
  p_product_description text DEFAULT NULL,
  p_delivery_location text DEFAULT NULL,
  p_external_source_url text DEFAULT NULL,
  p_discovered_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate basic inputs (defense in depth; anon path)
  IF coalesce(p_category, '') = '' OR coalesce(p_country, '') = '' THEN
    RETURN; -- silent no-op; do not leak details to anon callers
  END IF;

  -- Clamp scores
  p_intent_score := LEAST(GREATEST(coalesce(p_intent_score, 0), 0), 1);
  p_confidence_score := LEAST(GREATEST(coalesce(p_confidence_score, 0), 0), 1);

  INSERT INTO public.demand_intelligence_signals (
    signal_source, category, subcategory, country, buyer_type,
    classification, intent_score, confidence_score, decision_action,
    discovered_at, lane_state, product_description, delivery_location,
    external_source_url
  ) VALUES (
    p_signal_source, p_category, p_subcategory, upper(p_country), p_buyer_type,
    p_classification, p_intent_score, p_confidence_score, p_decision_action,
    p_discovered_at, p_lane_state, p_product_description, p_delivery_location,
    p_external_source_url
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_demand_signal(
  text, text, text, text, numeric, numeric, text,
  text, text, text, text, text, text, timestamptz
) TO anon, authenticated;
