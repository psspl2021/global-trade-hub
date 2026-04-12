
-- ==============================================
-- 1. PO STATUS TRANSITIONS (State Machine)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.po_status_transitions (
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  PRIMARY KEY (from_status, to_status)
);

ALTER TABLE public.po_status_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read transitions"
  ON public.po_status_transitions FOR SELECT
  TO authenticated USING (true);

INSERT INTO public.po_status_transitions (from_status, to_status) VALUES
  ('draft', 'sent'),
  ('sent', 'accepted'),
  ('accepted', 'in_transit'),
  ('in_transit', 'delivered'),
  ('delivered', 'payment_done'),
  ('payment_done', 'closed'),
  ('draft', 'cancelled'),
  ('sent', 'cancelled'),
  ('accepted', 'cancelled')
ON CONFLICT DO NOTHING;

-- ==============================================
-- 2. AUCTION INTEGRITY COLUMNS
-- ==============================================
ALTER TABLE public.reverse_auctions
  ADD COLUMN IF NOT EXISTS min_decrement_value NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS soft_close_seconds INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS max_bid_frequency_per_supplier INT DEFAULT 5;

-- ==============================================
-- 3. LANDED COST COLUMNS ON BIDS
-- ==============================================
ALTER TABLE public.bids
  ADD COLUMN IF NOT EXISTS base_price NUMERIC,
  ADD COLUMN IF NOT EXISTS freight_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_percent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_terms_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS landed_cost NUMERIC;

-- Auto-calculate landed_cost trigger
CREATE OR REPLACE FUNCTION public.calculate_landed_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.base_price IS NOT NULL THEN
    NEW.landed_cost := COALESCE(NEW.base_price, 0)
      + COALESCE(NEW.freight_cost, 0)
      + (COALESCE(NEW.base_price, 0) * COALESCE(NEW.gst_percent, 0) / 100);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_landed_cost ON public.bids;
CREATE TRIGGER trg_calculate_landed_cost
  BEFORE INSERT OR UPDATE OF base_price, freight_cost, gst_percent
  ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_landed_cost();

-- ==============================================
-- 4. ERP RECONCILIATION LOGS
-- ==============================================
CREATE TABLE IF NOT EXISTS public.erp_reconciliation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  erp_reference_id TEXT,
  status_in_erp TEXT,
  status_in_platform TEXT,
  is_mismatched BOOLEAN DEFAULT false,
  mismatch_details JSONB,
  checked_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_reconciliation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and PO owners can view reconciliation logs"
  ON public.erp_reconciliation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = erp_reconciliation_logs.po_id
      AND po.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_erp_recon_po_id ON public.erp_reconciliation_logs(po_id);
CREATE INDEX idx_erp_recon_mismatched ON public.erp_reconciliation_logs(is_mismatched) WHERE is_mismatched = true;

-- ==============================================
-- 5. MARKET PRICE SNAPSHOTS
-- ==============================================
CREATE TABLE IF NOT EXISTS public.market_price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  category TEXT,
  city TEXT,
  region TEXT,
  price_min NUMERIC NOT NULL,
  price_max NUMERIC NOT NULL,
  price_avg NUMERIC,
  currency TEXT DEFAULT 'INR',
  source TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.market_price_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read market prices"
  ON public.market_price_snapshots FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage market prices"
  ON public.market_price_snapshots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_market_price_product ON public.market_price_snapshots(product, city);
CREATE INDEX idx_market_price_recorded ON public.market_price_snapshots(recorded_at DESC);

-- ==============================================
-- 6. SUPPLIER SCORES
-- ==============================================
CREATE TABLE IF NOT EXISTS public.supplier_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  on_time_delivery_score NUMERIC DEFAULT 0,
  price_competitiveness_score NUMERIC DEFAULT 0,
  quality_score NUMERIC DEFAULT 0,
  reliability_score NUMERIC DEFAULT 0,
  total_orders_scored INT DEFAULT 0,
  last_scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id)
);

ALTER TABLE public.supplier_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read supplier scores"
  ON public.supplier_scores FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "System can manage supplier scores"
  ON public.supplier_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_supplier_scores_supplier ON public.supplier_scores(supplier_id);

-- ==============================================
-- 7. ROLE PERMISSIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated USING (true);

INSERT INTO public.role_permissions (role, permission) VALUES
  ('buyer_admin', 'can_create_po'),
  ('buyer_admin', 'can_approve_po'),
  ('buyer_admin', 'can_sync_erp'),
  ('buyer_admin', 'can_view_audit'),
  ('buyer_admin', 'can_manage_team'),
  ('buyer_operator', 'can_create_po'),
  ('buyer_operator', 'can_view_audit'),
  ('auditor', 'can_view_audit'),
  ('supplier', 'can_submit_bid'),
  ('supplier', 'can_confirm_po'),
  ('admin', 'can_create_po'),
  ('admin', 'can_approve_po'),
  ('admin', 'can_sync_erp'),
  ('admin', 'can_view_audit'),
  ('admin', 'can_manage_team'),
  ('admin', 'can_manage_pricing')
ON CONFLICT DO NOTHING;

-- ==============================================
-- 8. CHECK PERMISSION RPC
-- ==============================================
CREATE OR REPLACE FUNCTION public.check_permission(
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = p_user_id
    AND rp.permission = p_permission
  );
END;
$$;

-- ==============================================
-- 9. UPGRADED proceed_po_step WITH STATE MACHINE
-- ==============================================
CREATE OR REPLACE FUNCTION public.proceed_po_step(
  p_po_id UUID,
  p_new_status TEXT,
  p_updated_by UUID,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po RECORD;
  v_confirmed BOOLEAN;
  v_dup BOOLEAN;
  v_valid_transition BOOLEAN;
  v_has_permission BOOLEAN;
BEGIN
  -- Idempotency: reject duplicate keys
  IF p_idempotency_key IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.po_status_history
      WHERE idempotency_key = p_idempotency_key
    ) INTO v_dup;

    IF v_dup THEN
      RETURN jsonb_build_object('success', true, 'deduplicated', true);
    END IF;
  END IF;

  -- Lock the PO row to prevent concurrent updates
  SELECT po_source, external_po_number, status
  INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'PO not found');
  END IF;

  -- STATE MACHINE: Validate transition against allowed transitions table
  SELECT EXISTS (
    SELECT 1 FROM public.po_status_transitions
    WHERE from_status = v_po.status::TEXT
    AND to_status = p_new_status
  ) INTO v_valid_transition;

  IF NOT v_valid_transition THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', format('Invalid transition: %s → %s', v_po.status, p_new_status)
    );
  END IF;

  -- RBAC: Check permission based on target status
  IF p_new_status IN ('sent', 'payment_done', 'closed') THEN
    SELECT public.check_permission(p_updated_by, 'can_approve_po') INTO v_has_permission;
    IF NOT v_has_permission THEN
      RETURN jsonb_build_object('success', false, 'reason', 'Insufficient permissions for this action');
    END IF;
  END IF;

  -- Race-safe: re-check supplier confirmation for external POs
  IF v_po.po_source = 'external' THEN
    IF v_po.external_po_number IS NULL OR v_po.external_po_number = '' THEN
      RETURN jsonb_build_object('success', false, 'reason', 'External PO number missing');
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.supplier_po_acknowledgements
      WHERE po_id = p_po_id
      AND confirmed_po_number = v_po.external_po_number
    ) INTO v_confirmed;

    IF NOT v_confirmed THEN
      RETURN jsonb_build_object('success', false, 'reason', 'Supplier has not confirmed this PO number');
    END IF;
  END IF;

  -- Atomically update status
  UPDATE public.purchase_orders
  SET status = p_new_status::public.document_status, updated_at = now()
  WHERE id = p_po_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ==============================================
-- 10. VALIDATE BID RULES RPC (Auction Integrity)
-- ==============================================
CREATE OR REPLACE FUNCTION public.validate_bid_rules(
  p_auction_id UUID,
  p_supplier_id UUID,
  p_bid_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction RECORD;
  v_current_l1 NUMERIC;
  v_supplier_bid_count INT;
  v_last_bid_at TIMESTAMPTZ;
  v_time_remaining INTERVAL;
BEGIN
  -- Lock auction row
  SELECT * INTO v_auction
  FROM public.reverse_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Auction not found');
  END IF;

  IF v_auction.status != 'live' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Auction is not live');
  END IF;

  -- Check current L1
  v_current_l1 := v_auction.current_price;

  -- Minimum decrement check
  IF v_current_l1 IS NOT NULL AND p_bid_amount > (v_current_l1 - COALESCE(v_auction.min_decrement_value, 10)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', format('Bid must be at least ₹%s less than current L1 (₹%s)', v_auction.min_decrement_value, v_current_l1)
    );
  END IF;

  -- Max bid frequency check
  SELECT COUNT(*), MAX(created_at)
  INTO v_supplier_bid_count, v_last_bid_at
  FROM public.reverse_auction_bids
  WHERE auction_id = p_auction_id AND supplier_id = p_supplier_id::TEXT;

  IF v_supplier_bid_count >= COALESCE(v_auction.max_bid_frequency_per_supplier, 50) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Maximum bid limit reached for this auction');
  END IF;

  -- Rate limit: 2-second cooldown
  IF v_last_bid_at IS NOT NULL AND (now() - v_last_bid_at) < INTERVAL '2 seconds' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Please wait before placing another bid');
  END IF;

  -- Soft close: auto-extend if bid in final seconds
  IF v_auction.auction_end IS NOT NULL THEN
    v_time_remaining := v_auction.auction_end::TIMESTAMPTZ - now();
    IF v_time_remaining < (COALESCE(v_auction.soft_close_seconds, 30) || ' seconds')::INTERVAL THEN
      UPDATE public.reverse_auctions
      SET auction_end = (now() + INTERVAL '2 minutes')::TEXT,
          auto_extensions_used = COALESCE(auto_extensions_used, 0) + 1
      WHERE id = p_auction_id
      AND COALESCE(auto_extensions_used, 0) < COALESCE(max_auto_extensions, 10);
    END IF;
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- ==============================================
-- 11. UPDATE SUPPLIER SCORES ON PO CLOSE
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_supplier_score_on_close()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_on_time NUMERIC;
  v_delivery_due DATE;
BEGIN
  IF NEW.status::TEXT = 'closed' AND OLD.status::TEXT != 'closed' THEN
    -- Calculate on-time delivery score
    v_delivery_due := COALESCE(NEW.delivery_due_date, NEW.expected_delivery_date)::DATE;
    IF v_delivery_due IS NOT NULL AND NEW.payment_confirmed_at IS NOT NULL THEN
      IF NEW.payment_confirmed_at::DATE <= v_delivery_due THEN
        v_on_time := 100;
      ELSE
        v_on_time := GREATEST(0, 100 - (EXTRACT(DAY FROM (NEW.payment_confirmed_at::TIMESTAMP - v_delivery_due::TIMESTAMP)) * 10));
      END IF;
    ELSE
      v_on_time := 50; -- neutral
    END IF;

    INSERT INTO public.supplier_scores (supplier_id, on_time_delivery_score, total_orders_scored, last_scored_at)
    VALUES (NEW.supplier_id::UUID, v_on_time, 1, now())
    ON CONFLICT (supplier_id) DO UPDATE SET
      on_time_delivery_score = (
        (supplier_scores.on_time_delivery_score * supplier_scores.total_orders_scored + v_on_time)
        / (supplier_scores.total_orders_scored + 1)
      ),
      total_orders_scored = supplier_scores.total_orders_scored + 1,
      last_scored_at = now(),
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_supplier_score ON public.purchase_orders;
CREATE TRIGGER trg_update_supplier_score
  AFTER UPDATE OF status ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_score_on_close();

-- ==============================================
-- 12. PRICE INTELLIGENCE: Compare landed cost vs market
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_price_intelligence(
  p_product TEXT,
  p_city TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_market RECORD;
BEGIN
  SELECT price_min, price_max, price_avg, recorded_at
  INTO v_market
  FROM public.market_price_snapshots
  WHERE product ILIKE p_product
  AND (p_city IS NULL OR city ILIKE p_city)
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', false);
  END IF;

  RETURN jsonb_build_object(
    'available', true,
    'price_min', v_market.price_min,
    'price_max', v_market.price_max,
    'price_avg', v_market.price_avg,
    'recorded_at', v_market.recorded_at
  );
END;
$$;
