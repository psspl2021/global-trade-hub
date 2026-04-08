
CREATE OR REPLACE FUNCTION public.get_lowest_bids_batch(req_ids uuid[])
RETURNS TABLE(requirement_id uuid, lowest_bid_amount numeric, can_view boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_supplier_categories text[];
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY
      SELECT r.id, NULL::numeric, false
      FROM unnest(req_ids) AS r(id);
    RETURN;
  END IF;

  SELECT supplier_categories INTO v_supplier_categories
  FROM profiles
  WHERE id = v_user_id;

  IF v_supplier_categories IS NULL OR array_length(v_supplier_categories, 1) IS NULL THEN
    RETURN QUERY
      SELECT r.id, NULL::numeric, false
      FROM unnest(req_ids) AS r(id);
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    req.id AS requirement_id,
    CASE
      WHEN req.product_category = ANY(v_supplier_categories)
        THEN (SELECT MIN(b.bid_amount)::numeric FROM bids b WHERE b.requirement_id = req.id AND b.status NOT IN ('rejected', 'withdrawn'))
      ELSE NULL::numeric
    END AS lowest_bid_amount,
    (req.product_category = ANY(v_supplier_categories)) AS can_view
  FROM requirements req
  WHERE req.id = ANY(req_ids);
END;
$$;
