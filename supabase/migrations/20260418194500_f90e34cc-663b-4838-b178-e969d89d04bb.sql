-- ============================================================
-- STAGE 2: Write-path RPCs for create + atomic bid + anti-snipe
-- (REVOKE not applied yet — Stage 2 verification first)
-- ============================================================

-- ------------------------------------------------------------
-- 1. create_reverse_auction(payload jsonb) -> uuid
--    Minimal insert. Client continues line-items + invites orchestration.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_reverse_auction(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auction_id uuid;
  v_starting_price numeric;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF payload IS NULL OR payload = '{}'::jsonb THEN
    RAISE EXCEPTION 'Empty payload';
  END IF;

  v_starting_price := (payload->>'starting_price')::numeric;
  IF v_starting_price IS NULL OR v_starting_price <= 0 THEN
    RAISE EXCEPTION 'starting_price must be > 0';
  END IF;

  IF (payload->>'title') IS NULL OR length(trim(payload->>'title')) = 0 THEN
    RAISE EXCEPTION 'title is required';
  END IF;

  INSERT INTO public.reverse_auctions (
    buyer_id,
    title,
    product_slug,
    category,
    quantity,
    unit,
    starting_price,
    current_price,
    reserve_price,
    currency,
    minimum_bid_step_pct,
    auction_start,
    auction_end,
    transaction_type,
    status,
    description,
    rfq_type,
    destination_country,
    destination_state,
    delivery_address,
    payment_terms,
    certifications,
    quality_standards,
    deadline,
    incoterm,
    origin_country,
    shipment_mode
  )
  VALUES (
    v_uid, -- enforce buyer_id = auth.uid()
    payload->>'title',
    payload->>'product_slug',
    payload->>'category',
    NULLIF(payload->>'quantity','')::numeric,
    payload->>'unit',
    v_starting_price,
    v_starting_price, -- current_price seed
    NULLIF(payload->>'reserve_price','')::numeric,
    COALESCE(payload->>'currency', 'INR'),
    COALESCE(NULLIF(payload->>'minimum_bid_step_pct','')::numeric, 0.25),
    NULLIF(payload->>'auction_start','')::timestamptz,
    NULLIF(payload->>'auction_end','')::timestamptz,
    COALESCE(payload->>'transaction_type', 'domestic'),
    'scheduled',
    payload->>'description',
    COALESCE(payload->>'rfq_type', 'domestic'),
    COALESCE(payload->>'destination_country', 'India'),
    payload->>'destination_state',
    payload->>'delivery_address',
    payload->>'payment_terms',
    payload->>'certifications',
    payload->>'quality_standards',
    NULLIF(payload->>'deadline','')::timestamptz,
    payload->>'incoterm',
    payload->>'origin_country',
    payload->>'shipment_mode'
  )
  RETURNING id INTO v_auction_id;

  RETURN v_auction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_reverse_auction(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reverse_auction(jsonb) TO authenticated;

-- ------------------------------------------------------------
-- 2. place_bid_atomic(...)  -- CRITICAL HOT PATH
--    Atomic: invited-check + live-check + INSERT bid +
--            UPDATE auction.current_price = LEAST(current_price, new_bid)
--            + anti-snipe extend
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_bid_atomic(
  p_auction_id uuid,
  p_bid_price numeric,
  p_anti_snipe_threshold_seconds int DEFAULT 60,
  p_anti_snipe_extend_seconds int DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auction record;
  v_bid_id uuid;
  v_invited boolean;
  v_extended boolean := false;
  v_new_end timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_bid_price IS NULL OR p_bid_price <= 0 THEN
    RAISE EXCEPTION 'Invalid bid price';
  END IF;

  -- Lock the auction row to serialize concurrent bids
  SELECT id, status, current_price, starting_price, auction_start, auction_end
    INTO v_auction
  FROM public.reverse_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  IF v_auction.status <> 'live' THEN
    RAISE EXCEPTION 'Auction is not live (status=%)', v_auction.status;
  END IF;

  IF now() < v_auction.auction_start OR now() > v_auction.auction_end THEN
    RAISE EXCEPTION 'Auction not within active window';
  END IF;

  -- Bid must strictly beat current price
  IF p_bid_price >= v_auction.current_price THEN
    RAISE EXCEPTION 'Bid must be lower than current price (%)', v_auction.current_price;
  END IF;

  -- Invited supplier check
  SELECT EXISTS (
    SELECT 1 FROM public.reverse_auction_suppliers
    WHERE auction_id = p_auction_id
      AND (supplier_id = v_uid
           OR supplier_email = (SELECT email FROM auth.users WHERE id = v_uid))
  ) INTO v_invited;

  IF NOT v_invited THEN
    RAISE EXCEPTION 'Supplier not invited to this auction';
  END IF;

  -- INSERT bid
  INSERT INTO public.reverse_auction_bids (auction_id, supplier_id, bid_price)
  VALUES (p_auction_id, v_uid, p_bid_price)
  RETURNING id INTO v_bid_id;

  -- Atomic LEAST update on current_price
  UPDATE public.reverse_auctions
  SET current_price = LEAST(current_price, p_bid_price),
      updated_at = now()
  WHERE id = p_auction_id;

  -- Anti-snipe: extend if bid placed inside threshold window
  IF (v_auction.auction_end - now()) < make_interval(secs => p_anti_snipe_threshold_seconds) THEN
    v_new_end := v_auction.auction_end + make_interval(secs => p_anti_snipe_extend_seconds);
    UPDATE public.reverse_auctions
    SET auction_end = v_new_end,
        updated_at = now()
    WHERE id = p_auction_id;
    v_extended := true;
  END IF;

  -- Mark supplier invite row as bid_submitted (best-effort)
  UPDATE public.reverse_auction_suppliers
  SET invite_status = 'bid_submitted'
  WHERE auction_id = p_auction_id
    AND (supplier_id = v_uid
         OR supplier_email = (SELECT email FROM auth.users WHERE id = v_uid));

  RETURN jsonb_build_object(
    'bid_id', v_bid_id,
    'auction_id', p_auction_id,
    'new_current_price', LEAST(v_auction.current_price, p_bid_price),
    'extended', v_extended,
    'new_auction_end', COALESCE(v_new_end, v_auction.auction_end)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_bid_atomic(uuid, numeric, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_bid_atomic(uuid, numeric, int, int) TO authenticated;

-- ------------------------------------------------------------
-- 3. extend_auction_if_needed(...)  -- standalone anti-snipe
--    (Also called internally by place_bid_atomic; exposed for explicit triggers.)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.extend_auction_if_needed(
  p_auction_id uuid,
  p_threshold_seconds int DEFAULT 60,
  p_extend_seconds int DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auction record;
  v_extended boolean := false;
  v_new_end timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, status, auction_end
    INTO v_auction
  FROM public.reverse_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  IF v_auction.status <> 'live' THEN
    RETURN jsonb_build_object('extended', false, 'reason', 'not_live');
  END IF;

  IF (v_auction.auction_end - now()) < make_interval(secs => p_threshold_seconds) THEN
    v_new_end := v_auction.auction_end + make_interval(secs => p_extend_seconds);
    UPDATE public.reverse_auctions
    SET auction_end = v_new_end,
        updated_at = now()
    WHERE id = p_auction_id;
    v_extended := true;
  ELSE
    v_new_end := v_auction.auction_end;
  END IF;

  RETURN jsonb_build_object(
    'extended', v_extended,
    'auction_end', v_new_end
  );
END;
$$;

REVOKE ALL ON FUNCTION public.extend_auction_if_needed(uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.extend_auction_if_needed(uuid, int, int) TO authenticated;