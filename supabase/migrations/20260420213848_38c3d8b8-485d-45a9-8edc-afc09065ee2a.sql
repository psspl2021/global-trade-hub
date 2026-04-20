CREATE OR REPLACE FUNCTION public.replace_reverse_auction_items(
  p_auction_id uuid,
  p_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
BEGIN
  PERFORM public._assert_auction_owner(p_auction_id, auth.uid());

  DELETE FROM public.reverse_auction_items
  WHERE auction_id = p_auction_id;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.reverse_auction_items (
      auction_id,
      product_name,
      quantity,
      unit,
      category,
      description,
      unit_price
    )
    VALUES (
      p_auction_id,
      COALESCE(v_item->>'product_name', ''),
      COALESCE(NULLIF(v_item->>'quantity', '')::numeric, 0),
      COALESCE(NULLIF(v_item->>'unit', ''), 'MT'),
      NULLIF(v_item->>'category', ''),
      NULLIF(v_item->>'description', ''),
      COALESCE(NULLIF(v_item->>'unit_price', '')::numeric, 0)
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_reverse_auction_items(uuid, jsonb) TO authenticated;