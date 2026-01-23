-- Function to ensure requirement_item exists for single-item requirements
-- This runs with elevated privileges to bypass RLS for suppliers
CREATE OR REPLACE FUNCTION public.ensure_requirement_item_exists(
  p_requirement_id UUID,
  p_item_name TEXT,
  p_category TEXT,
  p_quantity NUMERIC,
  p_unit TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requirement_item_id UUID;
BEGIN
  -- Check if requirement_item already exists
  SELECT id INTO v_requirement_item_id
  FROM requirement_items
  WHERE requirement_id = p_requirement_id
  LIMIT 1;
  
  -- If exists, return it
  IF v_requirement_item_id IS NOT NULL THEN
    RETURN v_requirement_item_id;
  END IF;
  
  -- Verify the requirement exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM requirements 
    WHERE id = p_requirement_id 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Requirement does not exist or is not active';
  END IF;
  
  -- Create the requirement_item
  INSERT INTO requirement_items (
    requirement_id,
    item_name,
    category,
    quantity,
    unit
  )
  VALUES (
    p_requirement_id,
    p_item_name,
    p_category,
    p_quantity,
    p_unit
  )
  RETURNING id INTO v_requirement_item_id;
  
  RETURN v_requirement_item_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_requirement_item_exists TO authenticated;