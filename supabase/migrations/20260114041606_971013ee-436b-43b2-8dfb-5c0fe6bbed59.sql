-- Create secure RPC that validates supplier category access before returning L1 price
-- This ensures L1 pricing is protected at the database level, not just UI
CREATE OR REPLACE FUNCTION get_lowest_bid_secure(req_id uuid)
RETURNS TABLE(lowest_bid_amount numeric, can_view boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supplier_cats text[];
  req_category text;
  user_id uuid;
BEGIN
  -- Get the authenticated user
  user_id := auth.uid();
  
  -- If no authenticated user, return null (guests can see L1 for marketing purposes)
  IF user_id IS NULL THEN
    RETURN QUERY
    SELECT MIN(b.bid_amount)::numeric as lowest_bid_amount, true as can_view
    FROM bids b
    WHERE b.requirement_id = req_id
    AND b.status NOT IN ('rejected', 'withdrawn');
    RETURN;
  END IF;
  
  -- Get supplier's preferred categories
  SELECT p.supplier_categories INTO supplier_cats
  FROM profiles p
  WHERE p.id = user_id;
  
  -- Get the requirement's category
  SELECT r.product_category INTO req_category
  FROM requirements r
  WHERE r.id = req_id;
  
  -- If supplier has no categories set, allow viewing (new user)
  IF supplier_cats IS NULL OR array_length(supplier_cats, 1) IS NULL THEN
    RETURN QUERY
    SELECT MIN(b.bid_amount)::numeric as lowest_bid_amount, true as can_view
    FROM bids b
    WHERE b.requirement_id = req_id
    AND b.status NOT IN ('rejected', 'withdrawn');
    RETURN;
  END IF;
  
  -- Check if requirement category is in supplier's preferred categories
  IF req_category = ANY(supplier_cats) THEN
    -- Supplier can view L1 price
    RETURN QUERY
    SELECT MIN(b.bid_amount)::numeric as lowest_bid_amount, true as can_view
    FROM bids b
    WHERE b.requirement_id = req_id
    AND b.status NOT IN ('rejected', 'withdrawn');
  ELSE
    -- Supplier CANNOT view L1 price for non-preferred category
    RETURN QUERY
    SELECT NULL::numeric as lowest_bid_amount, false as can_view;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_lowest_bid_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_lowest_bid_secure(uuid) TO anon;