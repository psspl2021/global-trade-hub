
-- ============================================
-- 1. APPROVAL COLUMNS ON purchase_orders
-- ============================================
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS manager_approved_by UUID,
  ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS director_approved_by UUID,
  ADD COLUMN IF NOT EXISTS director_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auction_quality_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_drop_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_verified BOOLEAN DEFAULT false;

-- ============================================
-- 2. PO APPROVAL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS po_approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL,
  metadata JSONB,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_po_approval_idempotency
  ON po_approval_logs(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_po_approval_logs_po_id ON po_approval_logs(po_id);

ALTER TABLE po_approval_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view approval logs"
  ON po_approval_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.business_type = 'admin'
    )
  );

-- ============================================
-- 3. APPROVE PO STEP — ROW-LOCKED + INTELLIGENCE GATED
-- ============================================
CREATE OR REPLACE FUNCTION approve_po_step(
  p_po_id UUID,
  p_role TEXT,
  p_user_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_quality NUMERIC;
  v_savings NUMERIC;
  v_existing BOOLEAN;
BEGIN
  -- Idempotency check
  SELECT EXISTS(
    SELECT 1 FROM po_approval_logs WHERE idempotency_key = p_idempotency_key
  ) INTO v_existing;

  IF v_existing THEN
    RETURN json_build_object('success', true, 'idempotent', true);
  END IF;

  -- Lock PO row
  SELECT approval_status, auction_quality_score, price_drop_pct
    INTO v_current_status, v_quality, v_savings
    FROM purchase_orders
    WHERE id = p_po_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PO not found';
  END IF;

  -- Intelligence gate
  IF v_quality < 40 THEN
    RAISE EXCEPTION 'Blocked: Low competition auction (score: %)', v_quality;
  END IF;

  IF v_savings < 2 THEN
    RAISE EXCEPTION 'Blocked: Savings below threshold (%)', v_savings;
  END IF;

  -- Manager approval
  IF p_role = 'manager' AND v_current_status = 'pending_manager' THEN
    UPDATE purchase_orders SET
      approval_status = 'pending_director',
      manager_approved_by = p_user_id,
      manager_approved_at = now(),
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, 'MANAGER_APPROVED_PO', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'to_status', 'pending_director'));

  -- Director approval
  ELSIF p_role = 'director' AND v_current_status = 'pending_director' THEN
    UPDATE purchase_orders SET
      approval_status = 'approved',
      director_approved_by = p_user_id,
      director_approved_at = now(),
      locked = true,
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, 'DIRECTOR_APPROVED_PO', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'to_status', 'approved'));

  ELSE
    RAISE EXCEPTION 'Invalid approval flow: role=% status=%', p_role, v_current_status;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================
-- 4. CREATE PO FROM AUCTION (INTELLIGENCE SNAPSHOT)
-- ============================================
CREATE OR REPLACE FUNCTION create_po_from_auction(
  p_auction_id UUID,
  p_user_id UUID,
  p_po_value NUMERIC,
  p_vendor_name TEXT,
  p_supplier_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quality NUMERIC;
  v_savings NUMERIC;
  v_starting NUMERIC;
  v_winning NUMERIC;
  v_po_id UUID;
  v_po_number TEXT;
BEGIN
  -- Lock auction row to prevent concurrent PO creation
  SELECT starting_price, winning_price
    INTO v_starting, v_winning
    FROM reverse_auctions
    WHERE id = p_auction_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  -- Calculate quality (distinct bidders)
  SELECT COUNT(DISTINCT supplier_id) INTO v_quality
    FROM reverse_auction_bids
    WHERE auction_id = p_auction_id;

  -- Calculate savings
  IF v_starting IS NOT NULL AND v_starting > 0 AND v_winning IS NOT NULL THEN
    v_savings := ROUND(((v_starting - v_winning) / v_starting) * 100, 2);
  ELSE
    v_savings := 0;
  END IF;

  v_po_number := 'PO-' || EXTRACT(EPOCH FROM now())::BIGINT;
  v_po_id := gen_random_uuid();

  INSERT INTO purchase_orders(
    id, po_number, po_value, vendor_name, supplier_id,
    approval_status, auction_quality_score, price_drop_pct,
    approval_required, notes, created_by, po_source
  ) VALUES (
    v_po_id, v_po_number, p_po_value, p_vendor_name, p_supplier_id,
    'pending_manager', v_quality, v_savings,
    true, p_notes, p_user_id, 'auction'
  );

  INSERT INTO po_approval_logs(po_id, action, performed_by, metadata)
  VALUES (v_po_id, 'PO_CREATED_FROM_AUCTION', p_user_id,
          json_build_object('auction_id', p_auction_id, 'quality_score', v_quality, 'savings_pct', v_savings));

  RETURN json_build_object('success', true, 'po_id', v_po_id, 'po_number', v_po_number);
END;
$$;

-- ============================================
-- 5. ENFORCE SINGLE ACTIVE SESSION
-- ============================================
CREATE OR REPLACE FUNCTION enforce_single_active_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_device_info TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Deactivate all other sessions for this user
  UPDATE user_sessions
    SET active = false, last_seen_at = now()
    WHERE user_id = p_user_id
    AND active = true
    AND session_id != p_session_token;

  -- Upsert current session
  INSERT INTO user_sessions(user_id, session_id, device_info, active, started_at, last_seen_at)
  VALUES (p_user_id, p_session_token, p_device_info, true, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    active = true,
    last_seen_at = now()
  RETURNING id INTO v_session_id;

  RETURN json_build_object('success', true, 'session_id', v_session_id);
END;
$$;
