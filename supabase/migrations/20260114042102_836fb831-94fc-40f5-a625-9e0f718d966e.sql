-- Drop existing function and recreate with proper security
DROP FUNCTION IF EXISTS get_lowest_bid_secure(uuid);

-- Create enterprise-safe RPC for L1 pricing
-- Security: Blocks guests, validates supplier access, category-based entitlement
CREATE OR REPLACE FUNCTION get_lowest_bid_secure(req_id uuid)
RETURNS TABLE(lowest_bid_amount numeric, can_view boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_supplier_categories text[];
  v_req_category text;
  v_has_access boolean;
BEGIN
  -- SECURITY: Block unauthenticated users (guests cannot see L1)
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::numeric, false;
    RETURN;
  END IF;

  -- Get supplier's enabled categories
  SELECT supplier_categories INTO v_supplier_categories
  FROM profiles
  WHERE id = v_user_id;

  -- Get the requirement's category
  SELECT product_category INTO v_req_category
  FROM requirements
  WHERE id = req_id;

  -- If requirement doesn't exist
  IF v_req_category IS NULL THEN
    RETURN QUERY SELECT NULL::numeric, false;
    RETURN;
  END IF;

  -- BUSINESS RULE: Supplier with no categories = new user, block L1 access
  -- They can browse but not see competitive pricing
  IF v_supplier_categories IS NULL OR array_length(v_supplier_categories, 1) IS NULL THEN
    RETURN QUERY SELECT NULL::numeric, false;
    RETURN;
  END IF;

  -- ENTITLEMENT CHECK: Requirement category must be in supplier's enabled categories
  v_has_access := v_req_category = ANY(v_supplier_categories);

  IF NOT v_has_access THEN
    -- Supplier not entitled to this category's L1 pricing
    RETURN QUERY SELECT NULL::numeric, false;
    RETURN;
  END IF;

  -- AUTHORIZED: Calculate and return L1 price
  RETURN QUERY
  SELECT
    MIN(b.bid_amount)::numeric as lowest_bid_amount,
    true as can_view
  FROM bids b
  WHERE b.requirement_id = req_id
    AND b.status NOT IN ('rejected', 'withdrawn');
END;
$$;

-- PERMISSIONS: Only authenticated users, NO anonymous access
REVOKE ALL ON FUNCTION get_lowest_bid_secure(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_lowest_bid_secure(uuid) TO authenticated;