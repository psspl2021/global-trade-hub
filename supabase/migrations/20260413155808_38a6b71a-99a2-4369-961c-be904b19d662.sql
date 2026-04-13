
-- =========================================
-- 1. FIX: register_session → no auto-evict
--    Returns allowed:false if >= 2 active
-- =========================================
CREATE OR REPLACE FUNCTION public.register_session(
  p_user_id UUID,
  p_device_info TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_count INT;
  v_session_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_active_count
  FROM user_sessions
  WHERE user_id = p_user_id AND active = true;

  IF v_active_count >= 2 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'max_sessions_reached',
      'active_count', v_active_count
    );
  END IF;

  INSERT INTO user_sessions (user_id, device_info, active, last_seen_at)
  VALUES (p_user_id, p_device_info, true, now())
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'session_id', v_session_id
  );
END;
$$;

-- =========================================
-- 2. FIX: Auction limit inside transaction
-- =========================================
CREATE OR REPLACE FUNCTION public.create_auction_with_limit_check(
  p_buyer_id UUID,
  p_title TEXT,
  p_category TEXT DEFAULT NULL,
  p_subcategory TEXT DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_budget NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_limit INT;
  v_count INT;
  v_auction_id UUID;
BEGIN
  -- Lock buyer row to prevent concurrent checks
  SELECT COALESCE(bc.plan_type, 'free') INTO v_plan
  FROM buyer_company_members bcm
  JOIN buyer_companies bc ON bc.id = bcm.company_id
  WHERE bcm.user_id = p_buyer_id
  LIMIT 1
  FOR UPDATE OF bc;

  v_limit := CASE WHEN v_plan = 'paid' THEN 5 ELSE 1 END;

  SELECT COUNT(*) INTO v_count
  FROM reverse_auctions
  WHERE buyer_id = p_buyer_id AND status = 'live';

  IF v_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current', v_count,
      'limit', v_limit,
      'plan', v_plan,
      'reason', format('Max %s live auctions allowed on %s plan', v_limit, v_plan)
    );
  END IF;

  INSERT INTO reverse_auctions (buyer_id, title, category, subcategory, end_time, budget, status)
  VALUES (p_buyer_id, p_title, p_category, p_subcategory, p_end_time, p_budget, 'draft')
  RETURNING id INTO v_auction_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'auction_id', v_auction_id
  );
END;
$$;

-- =========================================
-- 3. FIX: Supplier cap trigger (race-safe)
-- =========================================
CREATE OR REPLACE FUNCTION public.enforce_supplier_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM reverse_auction_suppliers
  WHERE auction_id = NEW.auction_id;

  IF v_count >= 20 THEN
    RAISE EXCEPTION 'Supplier limit reached: maximum 20 suppliers per auction';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_supplier_cap ON public.reverse_auction_suppliers;
CREATE TRIGGER trg_enforce_supplier_cap
  BEFORE INSERT ON public.reverse_auction_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_supplier_cap();

-- =========================================
-- 4. FIX: Session cleanup function
-- =========================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM user_sessions
  WHERE last_seen_at < now() - interval '7 days'
     OR (active = false AND created_at < now() - interval '1 day');

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
