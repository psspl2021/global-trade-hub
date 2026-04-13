
-- 1. Index for session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
ON user_sessions(user_id, active);

-- 2. Harden supplier cap trigger with row-level lock
CREATE OR REPLACE FUNCTION public.enforce_supplier_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Lock existing rows for this auction to prevent race conditions
  PERFORM 1
  FROM reverse_auction_suppliers
  WHERE auction_id = NEW.auction_id
  FOR UPDATE;

  SELECT COUNT(*) INTO v_count
  FROM reverse_auction_suppliers
  WHERE auction_id = NEW.auction_id;

  IF v_count >= 20 THEN
    RAISE EXCEPTION 'Supplier limit reached: maximum 20 suppliers per auction';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Harden auction limit RPC with row-level lock on auctions too
CREATE OR REPLACE FUNCTION public.create_auction_with_limit_check(
  p_buyer_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL
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
  -- Lock buyer company row
  SELECT plan_type INTO v_plan
  FROM buyer_companies
  WHERE id = p_buyer_id
  FOR UPDATE;

  v_limit := CASE WHEN v_plan = 'paid' THEN 5 ELSE 1 END;

  -- Lock existing live auctions to prevent concurrent inserts
  PERFORM 1
  FROM reverse_auctions
  WHERE buyer_id = p_buyer_id AND status = 'live'
  FOR UPDATE;

  SELECT COUNT(*) INTO v_count
  FROM reverse_auctions
  WHERE buyer_id = p_buyer_id AND status = 'live';

  IF v_count >= v_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', format('Max %s live auctions allowed on your plan', v_limit)
    );
  END IF;

  INSERT INTO reverse_auctions (buyer_id, title, description, end_time, status)
  VALUES (p_buyer_id, p_title, p_description, p_end_time, 'live')
  RETURNING id INTO v_auction_id;

  RETURN jsonb_build_object('success', true, 'auction_id', v_auction_id);
END;
$$;
