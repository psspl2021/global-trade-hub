-- ============================================
-- CRITICAL SECURITY & LOGIC FIXES
-- ============================================

-- STEP 1: Revoke unsafe grants from authenticated users
REVOKE ALL ON public.admin_overview_metrics FROM authenticated;
REVOKE ALL ON public.admin_profit_summary FROM authenticated;
REVOKE ALL ON public.admin_deal_analytics FROM authenticated;
REVOKE ALL ON public.admin_ai_inventory_suppliers FROM authenticated;
REVOKE ALL ON public.admin_revenue_by_trade_type FROM authenticated;
REVOKE ALL ON public.admin_daily_kpis FROM authenticated;

-- STEP 2: Drop and recreate views with security_invoker and correct logic
DROP VIEW IF EXISTS public.admin_overview_metrics CASCADE;
DROP VIEW IF EXISTS public.admin_profit_summary CASCADE;
DROP VIEW IF EXISTS public.admin_deal_analytics CASCADE;
DROP VIEW IF EXISTS public.admin_ai_inventory_suppliers CASCADE;
DROP VIEW IF EXISTS public.admin_revenue_by_trade_type CASCADE;
DROP VIEW IF EXISTS public.admin_daily_kpis CASCADE;
DROP VIEW IF EXISTS public.supplier_inventory_performance CASCADE;
DROP VIEW IF EXISTS public.supplier_deal_closures CASCADE;

-- ============================================
-- ADMIN VIEWS (security_invoker = true, correct logic)
-- ============================================

-- A) Admin Overview Dashboard View (FIXED status logic)
CREATE VIEW public.admin_overview_metrics
WITH (security_invoker = true)
AS
SELECT
  COUNT(*) FILTER (WHERE rfq_source = 'ai_inventory') AS ai_inventory_requirements,
  COUNT(*) FILTER (WHERE COALESCE(rfq_source, 'manual') = 'manual') AS manual_requirements,
  COUNT(*) AS total_requirements,
  COUNT(DISTINCT buyer_id) AS active_buyers,
  COUNT(*) FILTER (WHERE status = 'active') AS active_rfqs,
  COUNT(*) FILTER (WHERE status IN ('awarded', 'closed')) AS deals_closed,
  COUNT(*) FILTER (WHERE status = 'closed') AS deals_completed
FROM public.requirements;

-- B) Admin Profit Summary View (FIXED: only count accepted bids with margin)
CREATE VIEW public.admin_profit_summary
WITH (security_invoker = true)
AS
SELECT
  DATE(created_at) AS date,
  SUM(COALESCE(platform_margin, 0)) AS total_profit,
  COUNT(*) AS deals_closed,
  SUM(COALESCE(buyer_visible_price, 0)) AS total_gmv,
  AVG(COALESCE(platform_margin, 0)) AS avg_margin_per_deal
FROM public.bids
WHERE status = 'accepted'
  AND platform_margin IS NOT NULL
  AND platform_margin > 0
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- C) Admin Deal Analytics View (FIXED: correct status filter)
CREATE VIEW public.admin_deal_analytics
WITH (security_invoker = true)
AS
SELECT
  b.id AS bid_id,
  b.requirement_id,
  r.title AS requirement_title,
  r.product_category,
  CASE
    WHEN r.trade_type IN ('domestic', 'domestic_india') THEN 'domestic'
    WHEN r.trade_type IN ('export', 'import') THEN r.trade_type
    ELSE 'domestic'
  END AS trade_type,
  r.rfq_source,
  b.supplier_id,
  p.company_name AS supplier_name,
  b.buyer_visible_price AS deal_value,
  b.supplier_net_price,
  b.platform_margin,
  b.markup_percentage,
  b.status AS bid_status,
  b.dispatched_qty,
  b.delivered_at,
  b.created_at AS bid_created_at,
  r.quantity,
  r.unit,
  r.delivery_location
FROM public.bids b
JOIN public.requirements r ON r.id = b.requirement_id
LEFT JOIN public.profiles p ON p.id = b.supplier_id
WHERE b.status = 'accepted';

-- D) AI Inventory Adoption View
CREATE VIEW public.admin_ai_inventory_suppliers
WITH (security_invoker = true)
AS
SELECT
  p.supplier_id,
  pr.company_name AS supplier_name,
  pr.city,
  COUNT(DISTINCT p.id) AS products_uploaded,
  COALESCE(SUM(si.quantity), 0) AS total_stock_units,
  COUNT(DISTINCT sim.product_id) AS ai_matched_products,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT p.id) > 0 
      THEN (COUNT(DISTINCT sim.product_id)::numeric / COUNT(DISTINCT p.id)::numeric) * 100 
      ELSE 0 
    END, 2
  ) AS match_rate_percent
FROM public.products p
LEFT JOIN public.stock_inventory si ON si.product_id = p.id
LEFT JOIN public.supplier_inventory_matches sim ON sim.product_id = p.id
LEFT JOIN public.profiles pr ON pr.id = p.supplier_id
WHERE p.is_active = true
GROUP BY p.supplier_id, pr.company_name, pr.city;

-- E) Admin Revenue by Trade Type View (FIXED: normalized trade_type)
CREATE VIEW public.admin_revenue_by_trade_type
WITH (security_invoker = true)
AS
SELECT
  CASE
    WHEN r.trade_type IN ('domestic', 'domestic_india') THEN 'domestic'
    WHEN r.trade_type IN ('export', 'import') THEN r.trade_type
    ELSE 'domestic'
  END AS trade_type,
  COUNT(DISTINCT b.id) AS deals_count,
  SUM(b.buyer_visible_price) AS total_gmv,
  SUM(b.platform_margin) AS total_margin,
  AVG(b.platform_margin) AS avg_margin,
  AVG(b.markup_percentage) AS avg_markup_percent
FROM public.bids b
JOIN public.requirements r ON r.id = b.requirement_id
WHERE b.status = 'accepted'
  AND b.platform_margin IS NOT NULL
GROUP BY CASE
    WHEN r.trade_type IN ('domestic', 'domestic_india') THEN 'domestic'
    WHEN r.trade_type IN ('export', 'import') THEN r.trade_type
    ELSE 'domestic'
  END;

-- F) Admin Daily KPIs View
CREATE VIEW public.admin_daily_kpis
WITH (security_invoker = true)
AS
SELECT
  DATE(r.created_at) AS date,
  COUNT(DISTINCT r.id) AS rfqs_created,
  COUNT(DISTINCT r.id) FILTER (WHERE r.rfq_source = 'ai_inventory') AS ai_rfqs,
  COUNT(DISTINCT b.id) AS bids_received,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'accepted') AS deals_closed,
  SUM(b.platform_margin) FILTER (WHERE b.status = 'accepted' AND b.platform_margin IS NOT NULL) AS daily_margin,
  COUNT(DISTINCT r.buyer_id) AS unique_buyers,
  COUNT(DISTINCT b.supplier_id) AS unique_suppliers
FROM public.requirements r
LEFT JOIN public.bids b ON b.requirement_id = r.id
GROUP BY DATE(r.created_at)
ORDER BY date DESC;

-- ============================================
-- SUPPLIER VIEWS (FIXED JOIN LOGIC)
-- ============================================

-- G) Supplier Inventory Performance View
-- FIXED: Join bids through requirements by matching product_category to product's category
-- This prevents double-counting across all products
CREATE VIEW public.supplier_inventory_performance
WITH (security_invoker = true)
AS
SELECT
  p.supplier_id,
  p.id AS product_id,
  p.name AS product_name,
  p.category,
  si.quantity AS current_stock,
  si.unit,
  COUNT(DISTINCT sim.id) AS ai_matches,
  -- Count deals where the bid is for this supplier AND requirement matches product category
  COUNT(DISTINCT b.id) FILTER (
    WHERE b.status = 'accepted' 
    AND r.product_category = p.category
  ) AS deals_closed,
  COALESCE(SUM(b.dispatched_qty) FILTER (
    WHERE b.status = 'accepted' 
    AND r.product_category = p.category
  ), 0) AS units_sold,
  COALESCE(SUM(b.supplier_net_price) FILTER (
    WHERE b.status = 'accepted' 
    AND r.product_category = p.category
  ), 0) AS revenue_earned
FROM public.products p
LEFT JOIN public.stock_inventory si ON si.product_id = p.id
LEFT JOIN public.supplier_inventory_matches sim ON sim.product_id = p.id
-- Join bids for THIS supplier only
LEFT JOIN public.bids b ON b.supplier_id = p.supplier_id
-- Join requirements to match category
LEFT JOIN public.requirements r ON r.id = b.requirement_id
WHERE p.is_active = true
GROUP BY p.supplier_id, p.id, p.name, p.category, si.quantity, si.unit;

-- H) Supplier Deal Closures View (No margin exposed)
CREATE VIEW public.supplier_deal_closures
WITH (security_invoker = true)
AS
SELECT
  b.id AS bid_id,
  b.requirement_id,
  r.title AS requirement_title,
  r.product_category,
  b.supplier_id,
  b.supplier_net_price AS supplier_receivable,
  b.dispatched_qty AS quantity_sold,
  b.status,
  b.delivered_at,
  b.created_at,
  r.delivery_location
FROM public.bids b
JOIN public.requirements r ON r.id = b.requirement_id
WHERE b.status = 'accepted';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Admin views: Only service_role (used by edge functions) can access
-- The frontend will call edge functions which verify admin status
GRANT SELECT ON public.admin_overview_metrics TO service_role;
GRANT SELECT ON public.admin_profit_summary TO service_role;
GRANT SELECT ON public.admin_deal_analytics TO service_role;
GRANT SELECT ON public.admin_ai_inventory_suppliers TO service_role;
GRANT SELECT ON public.admin_revenue_by_trade_type TO service_role;
GRANT SELECT ON public.admin_daily_kpis TO service_role;

-- Supplier views: authenticated users (RLS on underlying tables + security_invoker)
GRANT SELECT ON public.supplier_inventory_performance TO authenticated;
GRANT SELECT ON public.supplier_deal_closures TO authenticated;

-- ============================================
-- DOCUMENTATION
-- ============================================
COMMENT ON VIEW public.admin_overview_metrics IS 'Admin Control Tower: High-level RFQ and deal metrics (service_role only)';
COMMENT ON VIEW public.admin_profit_summary IS 'Admin Control Tower: Daily profit and GMV tracking - FIXED margin logic (service_role only)';
COMMENT ON VIEW public.admin_deal_analytics IS 'Admin Control Tower: Detailed deal-level analytics (service_role only)';
COMMENT ON VIEW public.admin_ai_inventory_suppliers IS 'Admin Control Tower: AI inventory adoption by supplier (service_role only)';
COMMENT ON VIEW public.admin_revenue_by_trade_type IS 'Admin Control Tower: Revenue by normalized trade type (service_role only)';
COMMENT ON VIEW public.admin_daily_kpis IS 'Admin Control Tower: Daily KPI dashboard data (service_role only)';
COMMENT ON VIEW public.supplier_inventory_performance IS 'Supplier Dashboard: Inventory and sales by category match (no margin)';
COMMENT ON VIEW public.supplier_deal_closures IS 'Supplier Dashboard: Deal history (no margin exposed)';