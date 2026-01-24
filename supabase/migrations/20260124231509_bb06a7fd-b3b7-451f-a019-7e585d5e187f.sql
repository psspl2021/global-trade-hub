-- =====================================================
-- BID DATA INTEGRITY SAFETY GUARDS
-- Prevents critical production bugs in bidding flow
-- =====================================================

-- 1. SYNC EXISTING VALUE MISMATCHES
-- Fix bids where bid_items.total doesn't match bids.buyer_visible_price
-- This corrects the backfill that used supplier_net_price instead of buyer_visible_price
UPDATE bid_items bi
SET 
  unit_price = CASE 
    WHEN bi.quantity > 0 THEN ROUND(b.buyer_visible_price / bi.quantity, 2)
    ELSE b.buyer_visible_price
  END,
  total = b.buyer_visible_price
FROM bids b
WHERE bi.bid_id = b.id
AND ABS(bi.total - b.buyer_visible_price) > 1
AND b.buyer_visible_price > 0;

-- 2. ENHANCED TRIGGER: Ensure bid_items are created with correct buyer-visible pricing
CREATE OR REPLACE FUNCTION public.ensure_bid_items_exist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_count INTEGER;
  v_requirement_item_id UUID;
  v_req_quantity NUMERIC;
BEGIN
  -- Check if bid_items exist for this bid
  SELECT COUNT(*) INTO v_item_count
  FROM bid_items
  WHERE bid_id = NEW.id;
  
  -- If no items exist, create one from requirement_items using BUYER-VISIBLE pricing
  IF v_item_count = 0 THEN
    -- Get the first requirement_item for this requirement
    SELECT id, quantity INTO v_requirement_item_id, v_req_quantity
    FROM requirement_items
    WHERE requirement_id = NEW.requirement_id
    ORDER BY created_at
    LIMIT 1;
    
    -- If no requirement_item exists, get quantity from requirement
    IF v_requirement_item_id IS NULL THEN
      SELECT quantity INTO v_req_quantity
      FROM requirements
      WHERE id = NEW.requirement_id;
      
      -- Create requirement_item first
      INSERT INTO requirement_items (
        requirement_id,
        item_name,
        category,
        quantity,
        unit
      )
      SELECT 
        NEW.requirement_id,
        r.title,
        COALESCE(r.product_category, ''),
        r.quantity,
        COALESCE(r.unit, 'Tons')
      FROM requirements r
      WHERE r.id = NEW.requirement_id
      RETURNING id INTO v_requirement_item_id;
    END IF;
    
    -- Create bid_item with BUYER-VISIBLE pricing (not supplier_net_price)
    IF v_requirement_item_id IS NOT NULL THEN
      INSERT INTO bid_items (
        bid_id,
        requirement_item_id,
        quantity,
        supplier_unit_price,
        unit_price,
        total
      )
      VALUES (
        NEW.id,
        v_requirement_item_id,
        COALESCE(v_req_quantity, 1),
        CASE WHEN COALESCE(v_req_quantity, 1) > 0 THEN ROUND(NEW.supplier_net_price / COALESCE(v_req_quantity, 1), 2) ELSE NEW.supplier_net_price END,
        CASE WHEN COALESCE(v_req_quantity, 1) > 0 THEN ROUND(NEW.buyer_visible_price / COALESCE(v_req_quantity, 1), 2) ELSE NEW.buyer_visible_price END,
        NEW.buyer_visible_price
      );
      
      -- Log auto-creation for monitoring
      RAISE NOTICE 'Auto-created bid_item for bid % with buyer_visible_price %', NEW.id, NEW.buyer_visible_price;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. CREATE TRIGGER to block bid acceptance if bid_items have zero pricing
CREATE OR REPLACE FUNCTION public.prevent_accept_zero_price_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_count INTEGER;
  v_zero_price_count INTEGER;
  v_total_value NUMERIC;
BEGIN
  -- Only check when transitioning to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Check if bid has any items
    SELECT COUNT(*), COALESCE(SUM(total), 0)
    INTO v_item_count, v_total_value
    FROM bid_items
    WHERE bid_id = NEW.id;
    
    IF v_item_count = 0 THEN
      RAISE EXCEPTION 'Cannot accept bid without bid_items. Bid ID: %', NEW.id
        USING HINT = 'Ensure bid_items are created before accepting the bid';
    END IF;
    
    -- Check for zero-priced items when bid value is positive
    IF NEW.buyer_visible_price > 0 AND v_total_value = 0 THEN
      RAISE EXCEPTION 'Cannot accept bid with zero-value bid_items. Bid ID: %, Expected: %, Got: %', 
        NEW.id, NEW.buyer_visible_price, v_total_value
        USING HINT = 'bid_items.total must match bids.buyer_visible_price';
    END IF;
    
    -- Check for significant mismatch (more than ₹100 difference)
    IF ABS(v_total_value - NEW.buyer_visible_price) > 100 THEN
      RAISE WARNING 'Price mismatch detected for bid %. bid_items.total: %, bids.buyer_visible_price: %', 
        NEW.id, v_total_value, NEW.buyer_visible_price;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS prevent_accept_zero_price_bid_trigger ON bids;
CREATE TRIGGER prevent_accept_zero_price_bid_trigger
  BEFORE UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION prevent_accept_zero_price_bid();

-- 4. CREATE AUDIT LOG TABLE for bid integrity issues
CREATE TABLE IF NOT EXISTS public.bid_integrity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id UUID REFERENCES bids(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  details JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bid_integrity_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access using existing has_role function
CREATE POLICY "Admins can view bid integrity logs"
  ON public.bid_integrity_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert bid integrity logs"
  ON public.bid_integrity_logs
  FOR INSERT
  WITH CHECK (true);

-- 5. LOG FUNCTION for tracking integrity issues
CREATE OR REPLACE FUNCTION public.log_bid_integrity_issue(
  p_bid_id UUID,
  p_issue_type TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO bid_integrity_logs (bid_id, issue_type, details)
  VALUES (p_bid_id, p_issue_type, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 6. Helper function for auto-assignment flows
CREATE OR REPLACE FUNCTION public.create_bid_item_for_auto_bid(
  p_bid_id UUID,
  p_requirement_id UUID,
  p_supplier_net_price NUMERIC,
  p_buyer_visible_price NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requirement_item_id UUID;
  v_quantity NUMERIC;
BEGIN
  -- Get requirement item
  SELECT id, quantity INTO v_requirement_item_id, v_quantity
  FROM requirement_items
  WHERE requirement_id = p_requirement_id
  LIMIT 1;
  
  -- If no requirement_item, create one
  IF v_requirement_item_id IS NULL THEN
    INSERT INTO requirement_items (requirement_id, item_name, category, quantity, unit)
    SELECT id, title, COALESCE(product_category, ''), quantity, COALESCE(unit, 'Tons')
    FROM requirements
    WHERE id = p_requirement_id
    RETURNING id, quantity INTO v_requirement_item_id, v_quantity;
  END IF;
  
  -- Create bid_item with correct pricing
  INSERT INTO bid_items (bid_id, requirement_item_id, quantity, supplier_unit_price, unit_price, total)
  VALUES (
    p_bid_id,
    v_requirement_item_id,
    COALESCE(v_quantity, 1),
    CASE WHEN COALESCE(v_quantity, 1) > 0 THEN ROUND(p_supplier_net_price / v_quantity, 2) ELSE p_supplier_net_price END,
    CASE WHEN COALESCE(v_quantity, 1) > 0 THEN ROUND(p_buyer_visible_price / v_quantity, 2) ELSE p_buyer_visible_price END,
    p_buyer_visible_price
  )
  ON CONFLICT DO NOTHING;
END;
$$;