-- Create a function to insert bid with items in a single transaction
CREATE OR REPLACE FUNCTION public.insert_bid_with_items(
  p_requirement_id UUID,
  p_supplier_id UUID,
  p_bid_amount NUMERIC,
  p_supplier_net_price NUMERIC,
  p_buyer_visible_price NUMERIC,
  p_markup_percentage NUMERIC,
  p_markup_amount NUMERIC,
  p_transaction_type TEXT,
  p_service_fee NUMERIC,
  p_total_amount NUMERIC,
  p_delivery_timeline_days INTEGER,
  p_terms_and_conditions TEXT,
  p_is_paid_bid BOOLEAN,
  p_items JSONB,
  p_logistics_execution_mode TEXT DEFAULT 'supplier_direct'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid_id UUID;
  v_item JSONB;
  v_requirement_item_id UUID;
BEGIN
  -- Insert the bid
  INSERT INTO bids (
    requirement_id,
    supplier_id,
    bid_amount,
    supplier_net_price,
    buyer_visible_price,
    markup_percentage,
    markup_amount,
    transaction_type,
    service_fee,
    total_amount,
    delivery_timeline_days,
    terms_and_conditions,
    is_paid_bid,
    logistics_execution_mode
  )
  VALUES (
    p_requirement_id,
    p_supplier_id,
    p_bid_amount,
    p_supplier_net_price,
    p_buyer_visible_price,
    p_markup_percentage,
    p_markup_amount,
    p_transaction_type,
    p_service_fee,
    p_total_amount,
    p_delivery_timeline_days,
    p_terms_and_conditions,
    p_is_paid_bid,
    p_logistics_execution_mode
  )
  RETURNING id INTO v_bid_id;
  
  -- Insert all bid items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Handle 'main' item case - ensure requirement_item exists
    IF v_item->>'requirement_item_id' = 'main' THEN
      -- Get or create requirement_item
      SELECT id INTO v_requirement_item_id
      FROM requirement_items
      WHERE requirement_id = p_requirement_id
      LIMIT 1;
      
      IF v_requirement_item_id IS NULL THEN
        -- Get requirement details for creating item
        INSERT INTO requirement_items (
          requirement_id,
          item_name,
          category,
          quantity,
          unit
        )
        SELECT 
          p_requirement_id,
          COALESCE(v_item->>'item_name', r.title),
          COALESCE(r.product_category, ''),
          (v_item->>'quantity')::NUMERIC,
          COALESCE(v_item->>'unit', r.unit)
        FROM requirements r
        WHERE r.id = p_requirement_id
        RETURNING id INTO v_requirement_item_id;
      END IF;
    ELSE
      v_requirement_item_id := (v_item->>'requirement_item_id')::UUID;
    END IF;
    
    INSERT INTO bid_items (
      bid_id,
      requirement_item_id,
      unit_price,
      supplier_unit_price,
      quantity,
      total
    )
    VALUES (
      v_bid_id,
      v_requirement_item_id,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'supplier_unit_price')::NUMERIC,
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'total')::NUMERIC
    );
  END LOOP;
  
  RETURN v_bid_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_bid_with_items TO authenticated;