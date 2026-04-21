-- 1. insert_bid_with_items: stamp currency + FX from requirement
CREATE OR REPLACE FUNCTION public.insert_bid_with_items(
  p_requirement_id uuid,
  p_supplier_id uuid,
  p_bid_amount numeric,
  p_supplier_net_price numeric,
  p_buyer_visible_price numeric,
  p_markup_percentage numeric,
  p_markup_amount numeric,
  p_transaction_type text,
  p_service_fee numeric,
  p_total_amount numeric,
  p_delivery_timeline_days integer,
  p_terms_and_conditions text,
  p_is_paid_bid boolean,
  p_items jsonb,
  p_logistics_execution_mode text DEFAULT 'supplier_direct'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bid_id UUID;
  v_item JSONB;
  v_requirement_item_id UUID;
  v_currency TEXT;
  v_fx_rate NUMERIC;
  v_fx_source TEXT;
  v_fx_ts TIMESTAMPTZ;
BEGIN
  -- Resolve requirement currency (default INR)
  SELECT COALESCE(currency, 'INR') INTO v_currency
  FROM requirements WHERE id = p_requirement_id;
  v_currency := COALESCE(v_currency, 'INR');

  -- Look up FX rate to INR
  IF v_currency = 'INR' THEN
    v_fx_rate := 1;
    v_fx_source := 'identity';
    v_fx_ts := now();
  ELSE
    SELECT rate_to_inr, source, COALESCE(updated_at, fetched_at)
      INTO v_fx_rate, v_fx_source, v_fx_ts
    FROM fx_rates WHERE currency_code = v_currency
    ORDER BY COALESCE(updated_at, fetched_at) DESC LIMIT 1;

    IF v_fx_rate IS NULL THEN
      v_fx_rate := 1;
      v_fx_source := 'unavailable';
      v_fx_ts := now();
    END IF;
  END IF;

  INSERT INTO bids (
    requirement_id, supplier_id, bid_amount, supplier_net_price,
    buyer_visible_price, markup_percentage, markup_amount, transaction_type,
    service_fee, total_amount, delivery_timeline_days, terms_and_conditions,
    is_paid_bid, logistics_execution_mode,
    bid_currency, fx_rate_to_inr, fx_source, fx_timestamp
  )
  VALUES (
    p_requirement_id, p_supplier_id, p_bid_amount, p_supplier_net_price,
    p_buyer_visible_price, p_markup_percentage, p_markup_amount, p_transaction_type,
    p_service_fee, p_total_amount, p_delivery_timeline_days, p_terms_and_conditions,
    p_is_paid_bid, p_logistics_execution_mode,
    v_currency, v_fx_rate, v_fx_source, v_fx_ts
  )
  RETURNING id INTO v_bid_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF v_item->>'requirement_item_id' = 'main' THEN
      SELECT id INTO v_requirement_item_id
      FROM requirement_items
      WHERE requirement_id = p_requirement_id LIMIT 1;

      IF v_requirement_item_id IS NULL THEN
        INSERT INTO requirement_items (
          requirement_id, item_name, category, quantity, unit
        )
        SELECT
          p_requirement_id,
          COALESCE(v_item->>'item_name', r.title),
          COALESCE(r.product_category, ''),
          (v_item->>'quantity')::NUMERIC,
          COALESCE(v_item->>'unit', r.unit)
        FROM requirements r WHERE r.id = p_requirement_id
        RETURNING id INTO v_requirement_item_id;
      END IF;
    ELSE
      v_requirement_item_id := (v_item->>'requirement_item_id')::UUID;
    END IF;

    INSERT INTO bid_items (
      bid_id, requirement_item_id, unit_price, supplier_unit_price, quantity, total
    )
    VALUES (
      v_bid_id, v_requirement_item_id,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'supplier_unit_price')::NUMERIC,
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'total')::NUMERIC
    );
  END LOOP;

  RETURN v_bid_id;
END;
$function$;

-- 2. create_po_from_auction: inherit currency + FX from auction's requirement
CREATE OR REPLACE FUNCTION public.create_po_from_auction(
  p_auction_id uuid,
  p_user_id uuid,
  p_po_value numeric,
  p_vendor_name text,
  p_supplier_id uuid,
  p_notes text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_quality NUMERIC;
  v_savings NUMERIC;
  v_starting NUMERIC;
  v_winning NUMERIC;
  v_po_id UUID;
  v_po_number TEXT;
  v_currency TEXT;
  v_fx_rate NUMERIC;
  v_fx_source TEXT;
  v_fx_ts TIMESTAMPTZ;
  v_req_id UUID;
BEGIN
  SELECT starting_price, winning_price, requirement_id, COALESCE(currency, 'INR')
    INTO v_starting, v_winning, v_req_id, v_currency
    FROM reverse_auctions
    WHERE id = p_auction_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  -- Prefer requirement.currency if set, else auction.currency
  IF v_req_id IS NOT NULL THEN
    SELECT COALESCE(currency, v_currency) INTO v_currency
    FROM requirements WHERE id = v_req_id;
  END IF;
  v_currency := COALESCE(v_currency, 'INR');

  SELECT COUNT(DISTINCT supplier_id) INTO v_quality
    FROM reverse_auction_bids WHERE auction_id = p_auction_id;

  IF v_starting IS NOT NULL AND v_starting > 0 AND v_winning IS NOT NULL THEN
    v_savings := ROUND(((v_starting - v_winning) / v_starting) * 100, 2);
  ELSE
    v_savings := 0;
  END IF;

  -- FX snapshot
  IF v_currency = 'INR' THEN
    v_fx_rate := 1; v_fx_source := 'identity'; v_fx_ts := now();
  ELSE
    SELECT rate_to_inr, source, COALESCE(updated_at, fetched_at)
      INTO v_fx_rate, v_fx_source, v_fx_ts
    FROM fx_rates WHERE currency_code = v_currency
    ORDER BY COALESCE(updated_at, fetched_at) DESC LIMIT 1;
    IF v_fx_rate IS NULL THEN
      v_fx_rate := 1; v_fx_source := 'unavailable'; v_fx_ts := now();
    END IF;
  END IF;

  v_po_number := 'PO-' || EXTRACT(EPOCH FROM now())::BIGINT;
  v_po_id := gen_random_uuid();

  INSERT INTO purchase_orders(
    id, po_number, po_value, vendor_name, supplier_id,
    approval_status, auction_quality_score, price_drop_pct,
    approval_required, notes, created_by, po_source,
    currency, base_currency, exchange_rate, fx_source, fx_timestamp,
    po_value_base_currency, region_type
  ) VALUES (
    v_po_id, v_po_number, p_po_value, p_vendor_name, p_supplier_id,
    'pending_manager', v_quality, v_savings,
    true, p_notes, p_user_id, 'auction',
    v_currency, 'INR', v_fx_rate, v_fx_source, v_fx_ts,
    p_po_value * v_fx_rate,
    CASE WHEN v_currency <> 'INR' THEN 'global' ELSE 'india' END
  );

  INSERT INTO po_approval_logs(po_id, action, performed_by, metadata)
  VALUES (v_po_id, 'PO_CREATED_FROM_AUCTION', p_user_id,
          json_build_object('auction_id', p_auction_id, 'quality_score', v_quality, 'savings_pct', v_savings, 'currency', v_currency, 'fx_rate', v_fx_rate));

  RETURN json_build_object('success', true, 'po_id', v_po_id, 'po_number', v_po_number);
END;
$function$;

-- 3. Safety-net trigger: auto-stamp currency + FX on any PO insert
CREATE OR REPLACE FUNCTION public.po_autofill_currency_fx()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_req_currency TEXT;
  v_auc_currency TEXT;
  v_fx_rate NUMERIC;
  v_fx_source TEXT;
  v_fx_ts TIMESTAMPTZ;
  v_resolved TEXT;
BEGIN
  -- If currency already set explicitly, only ensure FX is filled
  v_resolved := NEW.currency;

  IF v_resolved IS NULL OR v_resolved = '' THEN
    -- Try requirement first
    IF NEW.requirement_id IS NOT NULL THEN
      SELECT currency INTO v_req_currency FROM requirements WHERE id = NEW.requirement_id;
    END IF;
    IF v_req_currency IS NULL OR v_req_currency = '' THEN
      IF NEW.auction_id IS NOT NULL THEN
        SELECT currency INTO v_auc_currency FROM reverse_auctions WHERE id = NEW.auction_id;
      END IF;
    END IF;
    v_resolved := COALESCE(v_req_currency, v_auc_currency, 'INR');
    NEW.currency := v_resolved;
  END IF;

  IF NEW.base_currency IS NULL OR NEW.base_currency = '' THEN
    NEW.base_currency := 'INR';
  END IF;

  IF NEW.exchange_rate IS NULL OR NEW.fx_source IS NULL OR NEW.fx_timestamp IS NULL THEN
    IF v_resolved = 'INR' THEN
      v_fx_rate := 1; v_fx_source := 'identity'; v_fx_ts := now();
    ELSE
      SELECT rate_to_inr, source, COALESCE(updated_at, fetched_at)
        INTO v_fx_rate, v_fx_source, v_fx_ts
      FROM fx_rates WHERE currency_code = v_resolved
      ORDER BY COALESCE(updated_at, fetched_at) DESC LIMIT 1;
      IF v_fx_rate IS NULL THEN
        v_fx_rate := 1; v_fx_source := 'unavailable'; v_fx_ts := now();
      END IF;
    END IF;
    NEW.exchange_rate := COALESCE(NEW.exchange_rate, v_fx_rate);
    NEW.fx_source := COALESCE(NEW.fx_source, v_fx_source);
    NEW.fx_timestamp := COALESCE(NEW.fx_timestamp, v_fx_ts);
  END IF;

  IF NEW.po_value_base_currency IS NULL AND NEW.po_value IS NOT NULL THEN
    NEW.po_value_base_currency := NEW.po_value * COALESCE(NEW.exchange_rate, 1);
  END IF;

  -- Inherit incoterms from requirement if missing
  IF (NEW.incoterms IS NULL OR NEW.incoterms = '') AND NEW.requirement_id IS NOT NULL THEN
    SELECT incoterms INTO NEW.incoterms FROM requirements WHERE id = NEW.requirement_id;
  END IF;

  -- region_type
  IF NEW.region_type IS NULL OR NEW.region_type = '' THEN
    NEW.region_type := CASE WHEN COALESCE(NEW.currency, 'INR') <> 'INR' THEN 'global' ELSE 'india' END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_po_autofill_currency_fx ON public.purchase_orders;
CREATE TRIGGER trg_po_autofill_currency_fx
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.po_autofill_currency_fx();