-- Drop and recreate auto_assign_supplier with correct table/column references

DROP FUNCTION IF EXISTS public.auto_assign_supplier(uuid);

CREATE OR REPLACE FUNCTION public.auto_assign_supplier(p_requirement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requirement record;
  v_supplier record;
  v_estimated_price numeric;
BEGIN
  SELECT * INTO v_requirement
  FROM requirements
  WHERE id = p_requirement_id;
  
  IF v_requirement IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requirement not found');
  END IF;
  
  -- Find best supplier based on category performance
  -- Using products table (no stock_quantity column - use stock_inventory instead)
  SELECT 
    p.supplier_id,
    scp.l1_wins,
    scp.avg_price_per_unit,
    public.get_delivery_success_rate(p.supplier_id) as delivery_rate,
    COALESCE(p.quality_risk_score, 0) as quality_risk,
    EXISTS (
      SELECT 1 FROM products pr 
      JOIN stock_inventory si ON si.product_id = pr.id
      WHERE pr.supplier_id = p.supplier_id 
        AND pr.category = v_requirement.product_category
        AND si.quantity > 0
        AND pr.updated_at > NOW() - INTERVAL '7 days'
    ) as inventory_fresh
  INTO v_supplier
  FROM supplier_performance p
  LEFT JOIN supplier_category_performance scp 
    ON scp.supplier_id = p.supplier_id 
    AND scp.category = v_requirement.product_category
  WHERE COALESCE(p.quality_risk_score, 0) < 0.5
    AND public.get_delivery_success_rate(p.supplier_id) >= 0.7
  ORDER BY 
    scp.l1_wins DESC NULLS LAST,
    public.get_delivery_success_rate(p.supplier_id) DESC,
    p.quality_risk_score ASC NULLS LAST
  LIMIT 1;
  
  IF v_supplier IS NULL THEN
    -- Fallback: find any supplier with inventory in category
    SELECT 
      pr.supplier_id,
      AVG(pr.price_range_min) as avg_price,
      public.get_delivery_success_rate(pr.supplier_id) as delivery_rate,
      true as inventory_fresh
    INTO v_supplier
    FROM products pr
    JOIN stock_inventory si ON si.product_id = pr.id
    WHERE pr.category = v_requirement.product_category
      AND si.quantity > 0
    GROUP BY pr.supplier_id
    ORDER BY AVG(pr.price_range_min) ASC
    LIMIT 1;
    
    IF v_supplier IS NULL THEN
      -- Last fallback: any supplier in category without stock check
      SELECT 
        pr.supplier_id,
        AVG(pr.price_range_min) as avg_price,
        public.get_delivery_success_rate(pr.supplier_id) as delivery_rate,
        false as inventory_fresh
      INTO v_supplier
      FROM products pr
      WHERE pr.category = v_requirement.product_category
      GROUP BY pr.supplier_id
      ORDER BY AVG(pr.price_range_min) ASC
      LIMIT 1;
      
      IF v_supplier IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No suitable supplier found for this category');
      END IF;
    END IF;
    
    v_estimated_price := COALESCE(v_supplier.avg_price, 0) * v_requirement.quantity;
    
    RETURN jsonb_build_object(
      'success', true,
      'supplier_id', v_supplier.supplier_id,
      'estimated_price', v_estimated_price,
      'delivery_rate', COALESCE(v_supplier.delivery_rate, 0.85),
      'inventory_fresh', COALESCE(v_supplier.inventory_fresh, false),
      'fallback_used', true
    );
  END IF;
  
  v_estimated_price := COALESCE(v_supplier.avg_price_per_unit, 0) * v_requirement.quantity;
  
  RETURN jsonb_build_object(
    'success', true,
    'supplier_id', v_supplier.supplier_id,
    'estimated_price', v_estimated_price,
    'delivery_rate', v_supplier.delivery_rate,
    'l1_wins', COALESCE(v_supplier.l1_wins, 0),
    'inventory_fresh', COALESCE(v_supplier.inventory_fresh, false)
  );
END;
$$;