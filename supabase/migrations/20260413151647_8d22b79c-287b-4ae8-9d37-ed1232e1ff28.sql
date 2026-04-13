
-- 1. Add missing columns to user_sessions
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS device_info TEXT;

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, active);

-- 3. CHECK ACTIVE AUCTION LIMIT RPC
CREATE OR REPLACE FUNCTION public.check_active_auction_limit(p_buyer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_limit INT;
  v_count INT;
BEGIN
  SELECT bc.plan_type INTO v_plan
  FROM buyer_company_members bcm
  JOIN buyer_companies bc ON bc.id = bcm.company_id
  WHERE bcm.user_id = p_buyer_id
  LIMIT 1;

  v_plan := COALESCE(v_plan, 'free');
  v_limit := CASE WHEN v_plan = 'paid' THEN 5 ELSE 1 END;

  SELECT COUNT(*) INTO v_count
  FROM reverse_auctions
  WHERE buyer_id = p_buyer_id AND status = 'live';

  IF v_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false, 'current', v_count, 'limit', v_limit, 'plan', v_plan,
      'reason', format('You have %s live auction(s). Your %s plan allows max %s.', v_count, v_plan, v_limit)
    );
  END IF;

  RETURN jsonb_build_object('allowed', true, 'current', v_count, 'limit', v_limit, 'plan', v_plan);
END;
$$;

-- 4. VALIDATE SUPPLIER LIMIT RPC
CREATE OR REPLACE FUNCTION public.validate_supplier_limit(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_max INT := 20;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM reverse_auction_suppliers
  WHERE auction_id = p_auction_id AND (is_active IS NULL OR is_active = true);

  IF v_count >= v_max THEN
    RETURN jsonb_build_object(
      'valid', false, 'current', v_count, 'max', v_max,
      'reason', format('This auction already has %s suppliers. Maximum allowed is %s.', v_count, v_max)
    );
  END IF;

  RETURN jsonb_build_object('valid', true, 'current', v_count, 'max', v_max);
END;
$$;

-- 5. REGISTER SESSION RPC
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
  v_new_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_active_count
  FROM user_sessions WHERE user_id = p_user_id AND active = true;

  IF v_active_count >= 2 THEN
    UPDATE user_sessions SET active = false
    WHERE id IN (
      SELECT id FROM user_sessions
      WHERE user_id = p_user_id AND active = true
      ORDER BY last_seen_at ASC
      LIMIT (v_active_count - 1)
    );
  END IF;

  INSERT INTO user_sessions (user_id, active, device_info, session_id, started_at, last_seen_at)
  VALUES (p_user_id, true, p_device_info, gen_random_uuid()::text, now(), now())
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('session_id', v_new_id, 'evicted', v_active_count >= 2);
END;
$$;

-- 6. DEACTIVATE ALL SESSIONS RPC
CREATE OR REPLACE FUNCTION public.deactivate_user_sessions(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_sessions SET active = false WHERE user_id = p_user_id AND active = true;
END;
$$;
