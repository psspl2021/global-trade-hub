-- Drop existing functions first
DROP FUNCTION IF EXISTS public.select_supplier_with_bidding(uuid);
DROP FUNCTION IF EXISTS public.auto_assign_supplier(uuid);
DROP FUNCTION IF EXISTS public.get_delivery_success_rate(uuid);

-- Function to get delivery success rate for a supplier
CREATE OR REPLACE FUNCTION public.get_delivery_success_rate(p_supplier_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate numeric;
BEGIN
  SELECT 
    CASE 
      WHEN total_orders > 0 THEN (successful_deliveries::numeric / total_orders::numeric)
      ELSE 0.85
    END INTO v_rate
  FROM supplier_performance
  WHERE supplier_id = p_supplier_id;
  
  RETURN COALESCE(v_rate, 0.85);
END;
$$;

-- Function to select supplier from bids using L1 logic
CREATE OR REPLACE FUNCTION public.select_supplier_with_bidding(p_requirement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid record;
BEGIN
  -- Get the lowest total bid (L1) that meets risk thresholds
  SELECT 
    b.id as bid_id,
    b.supplier_id,
    b.buyer_visible_price as total_price,
    b.delivery_timeline_days,
    COALESCE(sp.quality_risk_score, 0) as quality_risk,
    public.get_delivery_success_rate(b.supplier_id) as delivery_rate
  INTO v_bid
  FROM bids b
  LEFT JOIN supplier_performance sp ON sp.supplier_id = b.supplier_id
  WHERE b.requirement_id = p_requirement_id
    AND b.status IN ('submitted', 'approved')
    AND COALESCE(sp.quality_risk_score, 0) < 0.5
  ORDER BY b.buyer_visible_price ASC
  LIMIT 1;
  
  IF v_bid IS NULL THEN
    SELECT 
      b.id as bid_id,
      b.supplier_id,
      b.buyer_visible_price as total_price,
      b.delivery_timeline_days,
      COALESCE(sp.quality_risk_score, 0) as quality_risk,
      public.get_delivery_success_rate(b.supplier_id) as delivery_rate
    INTO v_bid
    FROM bids b
    LEFT JOIN supplier_performance sp ON sp.supplier_id = b.supplier_id
    WHERE b.requirement_id = p_requirement_id
      AND b.status IN ('submitted', 'approved')
    ORDER BY b.buyer_visible_price ASC
    LIMIT 1;
    
    IF v_bid IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No bids found for this requirement');
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'supplier_id', v_bid.supplier_id,
      'bid_id', v_bid.bid_id,
      'total_price', v_bid.total_price,
      'delivery_days', v_bid.delivery_timeline_days,
      'quality_risk', v_bid.quality_risk,
      'delivery_rate', v_bid.delivery_rate,
      'fallback_triggered', true,
      'fallback_reason', 'Selected despite risk threshold - only available option'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'supplier_id', v_bid.supplier_id,
    'bid_id', v_bid.bid_id,
    'total_price', v_bid.total_price,
    'delivery_days', v_bid.delivery_timeline_days,
    'quality_risk', v_bid.quality_risk,
    'delivery_rate', v_bid.delivery_rate,
    'fallback_triggered', false
  );
END;
$$;

-- Function to auto-assign supplier based on historical performance
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
  
  SELECT 
    p.supplier_id,
    scp.l1_wins,
    scp.avg_unit_price,
    public.get_delivery_success_rate(p.supplier_id) as delivery_rate,
    COALESCE(p.quality_risk_score, 0) as quality_risk,
    EXISTS (
      SELECT 1 FROM products pr 
      WHERE pr.supplier_id = p.supplier_id 
        AND pr.category = v_requirement.product_category
        AND pr.stock_quantity > 0
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
    SELECT 
      pr.supplier_id,
      AVG(pr.price) as avg_price,
      public.get_delivery_success_rate(pr.supplier_id) as delivery_rate,
      true as inventory_fresh
    INTO v_supplier
    FROM products pr
    WHERE pr.category = v_requirement.product_category
      AND pr.stock_quantity > 0
    GROUP BY pr.supplier_id
    ORDER BY AVG(pr.price) ASC
    LIMIT 1;
    
    IF v_supplier IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No suitable supplier found for this category');
    END IF;
    
    v_estimated_price := v_supplier.avg_price * v_requirement.quantity;
    
    RETURN jsonb_build_object(
      'success', true,
      'supplier_id', v_supplier.supplier_id,
      'estimated_price', v_estimated_price,
      'delivery_rate', COALESCE(v_supplier.delivery_rate, 0.85),
      'inventory_fresh', true,
      'fallback_used', true
    );
  END IF;
  
  v_estimated_price := COALESCE(v_supplier.avg_unit_price, 0) * v_requirement.quantity;
  
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