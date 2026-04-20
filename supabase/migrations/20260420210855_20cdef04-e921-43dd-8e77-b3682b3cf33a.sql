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

  IF v_current_edits >= 5 THEN
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