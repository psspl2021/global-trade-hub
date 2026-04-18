-- Helper: ensure caller owns the auction
CREATE OR REPLACE FUNCTION public._assert_auction_owner(p_auction_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT buyer_id INTO v_owner FROM public.reverse_auctions WHERE id = p_auction_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'auction_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_owner <> p_user_id THEN
    RAISE EXCEPTION 'forbidden_not_owner' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- 1. start_reverse_auction
CREATE OR REPLACE FUNCTION public.start_reverse_auction(p_auction_id uuid)
RETURNS public.reverse_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.reverse_auctions;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());
  UPDATE public.reverse_auctions
  SET status = 'live', auction_start = now(), updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 2. cancel_reverse_auction
CREATE OR REPLACE FUNCTION public.cancel_reverse_auction(p_auction_id uuid)
RETURNS public.reverse_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.reverse_auctions;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());
  UPDATE public.reverse_auctions
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 3. complete_reverse_auction (picks lowest bid as winner)
CREATE OR REPLACE FUNCTION public.complete_reverse_auction(p_auction_id uuid)
RETURNS public.reverse_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.reverse_auctions;
  v_winner_bid_id uuid;
  v_winner_supplier uuid;
  v_winning_price numeric;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());

  SELECT id, supplier_id, bid_price
    INTO v_winner_bid_id, v_winner_supplier, v_winning_price
  FROM public.reverse_auction_bids
  WHERE auction_id = p_auction_id
  ORDER BY bid_price ASC
  LIMIT 1;

  IF v_winner_bid_id IS NOT NULL THEN
    UPDATE public.reverse_auction_bids SET is_winning = true WHERE id = v_winner_bid_id;
    UPDATE public.reverse_auctions
    SET status = 'completed',
        winner_supplier_id = v_winner_supplier,
        winning_price = v_winning_price,
        updated_at = now()
    WHERE id = p_auction_id
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.reverse_auctions
    SET status = 'completed', updated_at = now()
    WHERE id = p_auction_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

-- 4. update_reverse_auction (buyer edit, enforces 2-edit cap)
CREATE OR REPLACE FUNCTION public.update_reverse_auction(
  p_auction_id uuid,
  p_updates jsonb
)
RETURNS public.reverse_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.reverse_auctions;
  v_current_edits int;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());

  SELECT COALESCE(buyer_edit_count, 0) INTO v_current_edits
  FROM public.reverse_auctions WHERE id = p_auction_id;

  IF v_current_edits >= 2 THEN
    RAISE EXCEPTION 'edit_limit_reached' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.reverse_auctions SET
    title              = COALESCE((p_updates->>'title'), title),
    starting_price     = COALESCE((p_updates->>'starting_price')::numeric, starting_price),
    reserve_price      = CASE WHEN p_updates ? 'reserve_price'
                          THEN NULLIF(p_updates->>'reserve_price','')::numeric
                          ELSE reserve_price END,
    quantity           = COALESCE((p_updates->>'quantity')::numeric, quantity),
    unit               = COALESCE((p_updates->>'unit'), unit),
    product_slug       = COALESCE((p_updates->>'product_slug'), product_slug),
    auction_end        = COALESCE((p_updates->>'auction_end')::timestamptz, auction_end),
    description        = COALESCE((p_updates->>'description'), description),
    destination_country= COALESCE((p_updates->>'destination_country'), destination_country),
    destination_state  = COALESCE((p_updates->>'destination_state'), destination_state),
    delivery_address   = COALESCE((p_updates->>'delivery_address'), delivery_address),
    payment_terms      = COALESCE((p_updates->>'payment_terms'), payment_terms),
    certifications     = COALESCE((p_updates->>'certifications'), certifications),
    quality_standards  = COALESCE((p_updates->>'quality_standards'), quality_standards),
    deadline           = CASE WHEN p_updates ? 'deadline'
                          THEN NULLIF(p_updates->>'deadline','')::timestamptz
                          ELSE deadline END,
    buyer_edit_count   = v_current_edits + 1,
    updated_at         = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- 5. update_auction_status (lightweight transition; e.g. auto-status worker UI)
CREATE OR REPLACE FUNCTION public.update_auction_status(
  p_auction_id uuid,
  p_status text
)
RETURNS public.reverse_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.reverse_auctions;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());
  IF p_status NOT IN ('scheduled','live','completed','cancelled','expired') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;
  UPDATE public.reverse_auctions
  SET status = p_status, updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 6. extend_auction_end (anti-snipe / manual extension by buyer)
CREATE OR REPLACE FUNCTION public.extend_auction_end(
  p_auction_id uuid,
  p_new_end timestamptz
)
RETURNS public.reverse_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.reverse_auctions;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());
  UPDATE public.reverse_auctions
  SET auction_end = p_new_end, updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 7. republish_reverse_auction (resets winner state, optional new schedule, clears bids)
CREATE OR REPLACE FUNCTION public.republish_reverse_auction(
  p_auction_id uuid,
  p_auction_start timestamptz DEFAULT NULL,
  p_auction_end   timestamptz DEFAULT NULL,
  p_starting_price numeric DEFAULT NULL,
  p_quantity numeric DEFAULT NULL,
  p_unit text DEFAULT NULL
)
RETURNS public.reverse_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.reverse_auctions;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());

  UPDATE public.reverse_auctions SET
    status = 'scheduled',
    winner_supplier_id = NULL,
    winning_price = NULL,
    current_price = COALESCE(p_starting_price, starting_price),
    starting_price = COALESCE(p_starting_price, starting_price),
    auction_start = COALESCE(p_auction_start, auction_start),
    auction_end   = COALESCE(p_auction_end, auction_end),
    quantity = COALESCE(p_quantity, quantity),
    unit = COALESCE(p_unit, unit),
    buyer_edit_count = 0,
    updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;

  DELETE FROM public.reverse_auction_bids WHERE auction_id = p_auction_id;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_reverse_auction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reverse_auction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_reverse_auction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reverse_auction(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_auction_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_auction_end(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.republish_reverse_auction(uuid, timestamptz, timestamptz, numeric, numeric, text) TO authenticated;