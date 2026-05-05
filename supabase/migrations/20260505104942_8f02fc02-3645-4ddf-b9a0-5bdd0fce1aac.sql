-- ============================================================
-- FORWARD RFQ → PO APPROVAL FLOW
-- Mirrors auction PO gate (Manager → Head of Procurement) for forward bids.
-- Approval is OPTIONAL per buyer company (forward_po_approval_required toggle).
-- ============================================================

-- 1) Buyer company toggle (default OFF to preserve current direct-award behaviour)
ALTER TABLE public.buyer_companies
  ADD COLUMN IF NOT EXISTS forward_po_approval_required BOOLEAN NOT NULL DEFAULT false;

-- 2) Link PO to originating bid + uniqueness (one PO per accepted bid)
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_po_per_bid
  ON public.purchase_orders(bid_id)
  WHERE bid_id IS NOT NULL;

-- 3) New bid status: pending_award (PO created but awaiting internal approval)
ALTER TYPE public.bid_status ADD VALUE IF NOT EXISTS 'pending_award';

-- 4) Extend approval-gate trigger to cover 'rfq' source as well
CREATE OR REPLACE FUNCTION public.enforce_auction_po_approval_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.po_source IN ('auction', 'rfq') AND NEW.approval_required = true THEN
    NEW.approval_status := 'pending_manager';
    NEW.po_status := 'pending_approval';
    NEW.status := 'draft';
  END IF;
  RETURN NEW;
END;
$$;

-- 5) Manager approval RPC — extend to allow 'rfq' source
CREATE OR REPLACE FUNCTION public.approve_po_as_manager(_po_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_idem text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_po FROM purchase_orders WHERE id = _po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PO not found'; END IF;

  IF v_po.po_source NOT IN ('auction','rfq') THEN
    RAISE EXCEPTION 'This approval flow only applies to auction or RFQ POs';
  END IF;

  IF v_po.approval_status <> 'pending_manager' THEN
    RAISE EXCEPTION 'PO is not awaiting manager approval (current: %)', v_po.approval_status;
  END IF;

  IF NOT public.user_has_company_role_for_po(_po_id, ARRAY['manager','buyer_manager','operations_manager']) THEN
    RAISE EXCEPTION 'You do not have Manager rights for this PO';
  END IF;

  v_idem := 'mgr-approve-' || _po_id::text;

  UPDATE purchase_orders
     SET approval_status = 'pending_purchase_head',
         manager_approved_by = auth.uid(),
         manager_approved_at = now(),
         updated_at = now()
   WHERE id = _po_id;

  INSERT INTO po_approval_logs (po_id, action, performed_by, metadata, idempotency_key)
  VALUES (_po_id, 'manager_approved', auth.uid(),
          jsonb_build_object('notes', _notes, 'next_stage', 'pending_purchase_head', 'po_source', v_po.po_source), v_idem)
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'next_stage', 'pending_purchase_head');
END;
$$;

-- 6) Head-of-Procurement approval RPC — extend to RFQ + flip bid/requirement
CREATE OR REPLACE FUNCTION public.approve_po_as_purchase_head(_po_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_idem text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_po FROM purchase_orders WHERE id = _po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PO not found'; END IF;

  IF v_po.po_source NOT IN ('auction','rfq') THEN
    RAISE EXCEPTION 'This approval flow only applies to auction or RFQ POs';
  END IF;

  IF v_po.approval_status <> 'pending_purchase_head' THEN
    RAISE EXCEPTION 'PO is not awaiting Head of Procurement approval (current: %)', v_po.approval_status;
  END IF;

  IF NOT public.user_has_company_role_for_po(_po_id, ARRAY['purchase_head']) THEN
    RAISE EXCEPTION 'You do not have Head of Procurement rights for this PO';
  END IF;

  v_idem := 'head-approve-' || _po_id::text;

  UPDATE purchase_orders
     SET approval_status = 'approved',
         director_approved_by = auth.uid(),
         director_approved_at = now(),
         po_status = 'sent',
         status = 'sent',
         updated_at = now()
   WHERE id = _po_id;

  -- Forward RFQ: now finalize the auction-equivalent bid award
  IF v_po.po_source = 'rfq' AND v_po.bid_id IS NOT NULL AND v_po.requirement_id IS NOT NULL THEN
    UPDATE bids SET status = 'accepted', awarded_at = now(), updated_at = now()
     WHERE id = v_po.bid_id;

    UPDATE bids SET status = 'rejected', updated_at = now()
     WHERE requirement_id = v_po.requirement_id
       AND id <> v_po.bid_id
       AND status IN ('pending','pending_award');

    UPDATE requirements SET status = 'awarded', updated_at = now()
     WHERE id = v_po.requirement_id;
  END IF;

  INSERT INTO po_approval_logs (po_id, action, performed_by, metadata, idempotency_key)
  VALUES (_po_id, 'purchase_head_approved', auth.uid(),
          jsonb_build_object('notes', _notes, 'next_stage', 'approved', 'po_source', v_po.po_source), v_idem)
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'next_stage', 'approved', 'sent_to_supplier', true);
END;
$$;

-- 7) Rejection RPC — revert RFQ bid to pending so buyer can re-choose
CREATE OR REPLACE FUNCTION public.reject_po_approval(_po_id uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_stage text;
  v_idem text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF coalesce(trim(_reason),'') = '' THEN RAISE EXCEPTION 'Rejection reason required'; END IF;

  SELECT * INTO v_po FROM purchase_orders WHERE id = _po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PO not found'; END IF;

  IF v_po.approval_status NOT IN ('pending_manager','pending_purchase_head') THEN
    RAISE EXCEPTION 'PO is not in an approvable stage (current: %)', v_po.approval_status;
  END IF;

  IF v_po.approval_status = 'pending_manager' THEN
    IF NOT public.user_has_company_role_for_po(_po_id, ARRAY['manager','buyer_manager','operations_manager']) THEN
      RAISE EXCEPTION 'Not authorized to reject at manager stage';
    END IF;
    v_stage := 'manager_rejected';
  ELSE
    IF NOT public.user_has_company_role_for_po(_po_id, ARRAY['purchase_head']) THEN
      RAISE EXCEPTION 'Not authorized to reject at Head of Procurement stage';
    END IF;
    v_stage := 'purchase_head_rejected';
  END IF;

  v_idem := v_stage || '-' || _po_id::text;

  UPDATE purchase_orders
     SET approval_status = 'rejected',
         po_status = 'rejected',
         status = 'rejected',
         rejected_by = auth.uid(),
         rejected_at = now(),
         rejection_reason = _reason,
         updated_at = now()
   WHERE id = _po_id;

  -- For RFQ, revert bid to pending so buyer can re-evaluate
  IF v_po.po_source = 'rfq' AND v_po.bid_id IS NOT NULL THEN
    UPDATE bids SET status = 'pending', updated_at = now()
     WHERE id = v_po.bid_id AND status = 'pending_award';
  END IF;

  INSERT INTO po_approval_logs (po_id, action, performed_by, metadata, idempotency_key)
  VALUES (_po_id, v_stage, auth.uid(),
          jsonb_build_object('reason', _reason, 'po_source', v_po.po_source), v_idem)
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'status', 'rejected');
END;
$$;

-- 8) Resolve buyer company for a user (helper)
CREATE OR REPLACE FUNCTION public.get_buyer_company_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM buyer_company_members
  WHERE user_id = _user_id AND is_active = true
  ORDER BY created_at ASC LIMIT 1;
$$;

-- 9) Main entrypoint: accept a forward bid and create PO (with optional approval gate)
CREATE OR REPLACE FUNCTION public.accept_bid_and_create_po(
  _bid_id uuid,
  _notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid bids%ROWTYPE;
  v_req requirements%ROWTYPE;
  v_company_id uuid;
  v_approval_required boolean := false;
  v_po_id uuid := gen_random_uuid();
  v_po_number text;
  v_currency text;
  v_fx_rate numeric := 1;
  v_fx_source text := 'identity';
  v_fx_ts timestamptz := now();
  v_initial_status text;
  v_initial_po_status text;
  v_initial_doc_status text;
  v_initial_bid_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Lock bid + requirement
  SELECT * INTO v_bid FROM bids WHERE id = _bid_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bid not found'; END IF;

  IF v_bid.status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Bid is not in a pending state (current: %)', v_bid.status;
  END IF;

  SELECT * INTO v_req FROM requirements WHERE id = v_bid.requirement_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Requirement not found'; END IF;

  IF v_req.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the requirement owner can accept bids';
  END IF;

  IF v_req.status = 'awarded' THEN
    RAISE EXCEPTION 'Requirement is already awarded';
  END IF;

  -- Prevent duplicate PO for same bid
  IF EXISTS (SELECT 1 FROM purchase_orders WHERE bid_id = _bid_id) THEN
    RAISE EXCEPTION 'A purchase order already exists for this bid';
  END IF;

  -- Resolve buyer company + approval toggle
  v_company_id := public.get_buyer_company_for_user(auth.uid());
  IF v_company_id IS NOT NULL THEN
    SELECT COALESCE(forward_po_approval_required, false)
      INTO v_approval_required
      FROM buyer_companies WHERE id = v_company_id;
  END IF;

  -- Currency / FX snapshot from requirement
  v_currency := COALESCE(v_req.currency, v_bid.bid_currency, 'INR');
  IF v_currency <> 'INR' THEN
    SELECT rate_to_inr, source, COALESCE(updated_at, fetched_at)
      INTO v_fx_rate, v_fx_source, v_fx_ts
      FROM fx_rates WHERE currency_code = v_currency
      ORDER BY COALESCE(updated_at, fetched_at) DESC LIMIT 1;
    IF v_fx_rate IS NULL THEN
      v_fx_rate := 1; v_fx_source := 'unavailable'; v_fx_ts := now();
    END IF;
  END IF;

  v_po_number := 'PO-' || EXTRACT(EPOCH FROM now())::BIGINT;

  -- Determine initial states
  IF v_approval_required THEN
    v_initial_status := 'pending_manager';
    v_initial_po_status := 'pending_approval';
    v_initial_doc_status := 'draft';
    v_initial_bid_status := 'pending_award';
  ELSE
    v_initial_status := 'approved';
    v_initial_po_status := 'sent';
    v_initial_doc_status := 'sent';
    v_initial_bid_status := 'accepted';
  END IF;

  INSERT INTO purchase_orders (
    id, po_number, po_value, total_amount, vendor_name, supplier_id,
    bid_id, requirement_id, buyer_company_id,
    approval_status, approval_required,
    po_status, status,
    notes, created_by, purchaser_id, po_source,
    currency, base_currency, exchange_rate, fx_source, fx_timestamp,
    po_value_base_currency, region_type
  ) VALUES (
    v_po_id, v_po_number, v_bid.total_amount, v_bid.total_amount,
    COALESCE((SELECT company_name FROM profiles WHERE id = v_bid.supplier_id), 'Supplier'),
    v_bid.supplier_id,
    _bid_id, v_req.id, v_company_id,
    v_initial_status, v_approval_required,
    v_initial_po_status, v_initial_doc_status::document_status,
    _notes, auth.uid(), auth.uid(), 'rfq',
    v_currency, 'INR', v_fx_rate, v_fx_source, v_fx_ts,
    v_bid.total_amount * v_fx_rate,
    CASE WHEN v_currency <> 'INR' THEN 'global' ELSE 'india' END
  );

  -- Update bid + requirement based on path
  UPDATE bids SET status = v_initial_bid_status::bid_status, updated_at = now()
   WHERE id = _bid_id;

  IF NOT v_approval_required THEN
    -- Direct award: reject other pending bids + mark requirement awarded
    UPDATE bids SET status = 'rejected', updated_at = now()
     WHERE requirement_id = v_req.id AND id <> _bid_id AND status = 'pending';

    UPDATE requirements SET status = 'awarded', updated_at = now()
     WHERE id = v_req.id;
  END IF;

  INSERT INTO po_approval_logs (po_id, action, performed_by, metadata)
  VALUES (
    v_po_id,
    CASE WHEN v_approval_required THEN 'PO_CREATED_FROM_RFQ_PENDING_APPROVAL' ELSE 'PO_CREATED_FROM_RFQ_DIRECT_AWARD' END,
    auth.uid(),
    jsonb_build_object('bid_id', _bid_id, 'requirement_id', v_req.id, 'approval_required', v_approval_required, 'currency', v_currency)
  );

  RETURN jsonb_build_object(
    'success', true,
    'po_id', v_po_id,
    'po_number', v_po_number,
    'approval_required', v_approval_required,
    'bid_status', v_initial_bid_status,
    'requirement_awarded', NOT v_approval_required
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_bid_and_create_po(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_buyer_company_for_user(uuid) TO authenticated;