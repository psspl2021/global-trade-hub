CREATE OR REPLACE FUNCTION public.award_reverse_auction(
  p_auction_id uuid,
  p_winner_supplier_id uuid
)
RETURNS public.reverse_auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.reverse_auctions;
  v_winning_price numeric;
  v_bid_id uuid;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());

  SELECT id, bid_price INTO v_bid_id, v_winning_price
  FROM public.reverse_auction_bids
  WHERE auction_id = p_auction_id AND supplier_id = p_winner_supplier_id
  ORDER BY bid_price ASC
  LIMIT 1;

  IF v_bid_id IS NULL THEN
    RAISE EXCEPTION 'supplier_has_no_bid' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.reverse_auction_bids SET is_winning = true WHERE id = v_bid_id;

  UPDATE public.reverse_auctions
  SET winner_supplier_id = p_winner_supplier_id,
      winning_price = v_winning_price,
      status = 'completed',
      auction_end = now(),
      updated_at = now()
  WHERE id = p_auction_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_reverse_auction(uuid, uuid) TO authenticated;