
-- 1. Add global fields to purchase_orders
ALTER TABLE public.purchase_orders 
  ADD COLUMN IF NOT EXISTS vendor_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS incoterms TEXT,
  ADD COLUMN IF NOT EXISTS region_type TEXT DEFAULT 'india';

-- 2. Add currency to po_finance_logs
ALTER TABLE public.po_finance_logs
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- 3. Add org_timezone to buyer_companies
ALTER TABLE public.buyer_companies
  ADD COLUMN IF NOT EXISTS org_timezone TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS region_type TEXT DEFAULT 'india';

-- 4. Update record_po_payment to be currency-aware
CREATE OR REPLACE FUNCTION public.record_po_payment(
  p_po_id UUID,
  p_user_id UUID,
  p_payment_reference TEXT,
  p_amount NUMERIC,
  p_idempotency_key TEXT,
  p_currency TEXT DEFAULT 'INR'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status TEXT;
  v_payment_status TEXT;
  v_existing BOOLEAN;
  v_budget_cap NUMERIC;
  v_po_currency TEXT;
BEGIN
  PERFORM validate_active_session(p_user_id);

  -- Idempotency
  SELECT EXISTS(
    SELECT 1 FROM po_finance_logs WHERE metadata->>'idempotency_key' = p_idempotency_key
  ) INTO v_existing;
  IF v_existing THEN
    RETURN json_build_object('success', true, 'idempotent', true);
  END IF;

  SELECT approval_status, payment_status, budget_cap, currency
    INTO v_status, v_payment_status, v_budget_cap, v_po_currency
    FROM purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF v_status != 'approved' THEN
    RAISE EXCEPTION 'PO must be approved before payment (current: %)', v_status;
  END IF;

  IF v_payment_status = 'paid' THEN
    RAISE EXCEPTION 'PO already paid';
  END IF;

  -- Currency mismatch check
  IF v_po_currency IS NOT NULL AND v_po_currency != p_currency THEN
    RAISE EXCEPTION 'Currency mismatch: PO is in % but payment is in %', v_po_currency, p_currency;
  END IF;

  -- Budget cap enforcement
  IF v_budget_cap IS NOT NULL AND p_amount > v_budget_cap THEN
    RAISE EXCEPTION 'Payment amount % exceeds budget cap % — CFO override required', p_amount, v_budget_cap;
  END IF;

  UPDATE purchase_orders SET
    payment_status = 'paid',
    payment_reference = p_payment_reference,
    payment_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_po_id;

  INSERT INTO po_finance_logs(po_id, action, amount, payment_reference, performed_by, currency, metadata)
  VALUES (p_po_id, 'PAYMENT_CONFIRMED', p_amount, p_payment_reference, p_user_id, p_currency,
          json_build_object('idempotency_key', p_idempotency_key, 'currency', p_currency));

  RETURN json_build_object('success', true, 'payment_status', 'paid', 'currency', p_currency);
END;
$function$;

-- 5. Update escalate_stale_approvals to be timezone-aware
CREATE OR REPLACE FUNCTION public.escalate_stale_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_po RECORD;
BEGIN
  FOR v_po IN
    UPDATE purchase_orders po SET
      approval_status = 'pending_director',
      approval_escalated = true,
      escalated_at = now(),
      updated_at = now()
    FROM buyer_companies bc
    JOIN buyer_company_members bcm ON bcm.company_id = bc.id
    WHERE bcm.user_id = po.created_by
      AND po.approval_status = 'pending_manager'
      AND po.updated_at < (now() AT TIME ZONE COALESCE(bc.org_timezone, 'Asia/Kolkata')) - interval '24 hours'
      AND po.approval_escalated = false
    RETURNING po.id
  LOOP
    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (v_po.id, 'AUTO_ESCALATED', '00000000-0000-0000-0000-000000000000'::uuid,
            'escalation_' || v_po.id || '_' || extract(epoch from now())::text,
            json_build_object('reason', 'Manager approval timeout (24h, timezone-aware)'));
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;

-- 6. Create session-validated bid placement wrapper
CREATE OR REPLACE FUNCTION public.place_bid_with_session(
  p_user_id UUID,
  p_auction_id UUID,
  p_bid_price NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSON;
  v_auction_status TEXT;
  v_existing_bid BOOLEAN;
BEGIN
  -- Session validation first
  PERFORM validate_active_session(p_user_id);

  -- Verify auction is active
  SELECT status INTO v_auction_status
  FROM reverse_auctions WHERE id = p_auction_id FOR UPDATE;

  IF v_auction_status IS NULL THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  IF v_auction_status != 'active' THEN
    RAISE EXCEPTION 'Auction is not active (status: %)', v_auction_status;
  END IF;

  -- Insert bid
  INSERT INTO reverse_auction_bids(auction_id, supplier_id, bid_price, notes)
  VALUES (p_auction_id, p_user_id, p_bid_price, p_notes);

  RETURN json_build_object('success', true, 'auction_id', p_auction_id);
END;
$function$;

-- 7. Create session-validated RFQ submission wrapper  
CREATE OR REPLACE FUNCTION public.submit_rfq_with_session(
  p_user_id UUID,
  p_category TEXT,
  p_subcategory TEXT,
  p_description TEXT,
  p_quantity NUMERIC DEFAULT NULL,
  p_unit TEXT DEFAULT NULL,
  p_delivery_location TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_req_id UUID;
BEGIN
  -- Session validation first
  PERFORM validate_active_session(p_user_id);

  INSERT INTO requirements(buyer_id, category, subcategory, description, quantity, unit, delivery_location, status)
  VALUES (p_user_id, p_category, p_subcategory, p_description, p_quantity, p_unit, p_delivery_location, 'open')
  RETURNING id INTO v_req_id;

  RETURN json_build_object('success', true, 'requirement_id', v_req_id);
END;
$function$;

-- 8. Create session-validated auction creation wrapper
CREATE OR REPLACE FUNCTION public.create_auction_with_session(
  p_user_id UUID,
  p_requirement_id UUID,
  p_title TEXT,
  p_end_time TIMESTAMPTZ,
  p_reserve_price NUMERIC DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_auction_id UUID;
BEGIN
  -- Session validation first
  PERFORM validate_active_session(p_user_id);

  INSERT INTO reverse_auctions(buyer_id, requirement_id, title, end_time, reserve_price, status)
  VALUES (p_user_id, p_requirement_id, p_title, p_end_time, p_reserve_price, 'draft')
  RETURNING id INTO v_auction_id;

  RETURN json_build_object('success', true, 'auction_id', v_auction_id);
END;
$function$;

-- 9. Add index for global PO queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_region ON public.purchase_orders(region_type);
CREATE INDEX IF NOT EXISTS idx_buyer_companies_region ON public.buyer_companies(region_type);
