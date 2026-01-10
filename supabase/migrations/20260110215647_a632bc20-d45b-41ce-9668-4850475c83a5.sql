-- ============================================
-- ADMIN CONTROL TOWER - SQL VIEWS
-- ============================================

-- Drop existing views if they exist (clean slate)
DROP VIEW IF EXISTS public.admin_overview_metrics CASCADE;
DROP VIEW IF EXISTS public.admin_profit_summary CASCADE;
DROP VIEW IF EXISTS public.admin_deal_analytics CASCADE;
DROP VIEW IF EXISTS public.admin_ai_inventory_suppliers CASCADE;
DROP VIEW IF EXISTS public.admin_revenue_by_trade_type CASCADE;
DROP VIEW IF EXISTS public.admin_daily_kpis CASCADE;
DROP VIEW IF EXISTS public.supplier_inventory_performance CASCADE;
DROP VIEW IF EXISTS public.supplier_deal_closures CASCADE;

-- A) Admin Overview Dashboard View
CREATE VIEW public.admin_overview_metrics AS
SELECT
  COUNT(*) FILTER (WHERE rfq_source = 'ai_inventory') AS ai_inventory_requirements,
  COUNT(*) FILTER (WHERE rfq_source = 'manual' OR rfq_source IS NULL) AS manual_requirements,
  COUNT(*) AS total_requirements,
  COUNT(DISTINCT buyer_id) AS active_buyers,
  COUNT(*) FILTER (WHERE status = 'active') AS active_rfqs,
  COUNT(*) FILTER (WHERE status = 'awarded') AS deals_closed,
  COUNT(*) FILTER (WHERE status = 'closed') AS deals_completed
FROM public.requirements;

-- B) Admin Profit Summary View
CREATE VIEW public.admin_profit_summary AS
SELECT
  DATE(created_at) AS date,
  SUM(COALESCE(platform_margin, 0)) AS total_profit,
  COUNT(*) FILTER (WHERE status = 'accepted') AS deals_closed,
  SUM(COALESCE(buyer_visible_price, 0)) FILTER (WHERE status = 'accepted') AS total_gmv,
  AVG(COALESCE(platform_margin, 0)) FILTER (WHERE status = 'accepted') AS avg_margin_per_deal
FROM public.bids
WHERE platform_margin > 0 OR status = 'accepted'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- C) Admin Deal Analytics View (uses 'accepted' status only)
CREATE VIEW public.admin_deal_analytics AS
SELECT
  b.id AS bid_id,
  b.requirement_id,
  r.title AS requirement_title,
  r.product_category,
  r.trade_type,
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

-- D) AI Inventory Adoption View (Supplier Side)
CREATE VIEW public.admin_ai_inventory_suppliers AS
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

-- E) Admin Revenue by Trade Type View
CREATE VIEW public.admin_revenue_by_trade_type AS
SELECT
  COALESCE(r.trade_type, 'domestic') AS trade_type,
  COUNT(DISTINCT b.id) AS deals_count,
  SUM(b.buyer_visible_price) AS total_gmv,
  SUM(b.platform_margin) AS total_margin,
  AVG(b.platform_margin) AS avg_margin,
  AVG(b.markup_percentage) AS avg_markup_percent
FROM public.bids b
JOIN public.requirements r ON r.id = b.requirement_id
WHERE b.status = 'accepted'
GROUP BY COALESCE(r.trade_type, 'domestic');

-- F) Admin Daily KPIs View
CREATE VIEW public.admin_daily_kpis AS
SELECT
  DATE(r.created_at) AS date,
  COUNT(DISTINCT r.id) AS rfqs_created,
  COUNT(DISTINCT r.id) FILTER (WHERE r.rfq_source = 'ai_inventory') AS ai_rfqs,
  COUNT(DISTINCT b.id) AS bids_received,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'accepted') AS deals_closed,
  SUM(b.platform_margin) FILTER (WHERE b.status = 'accepted') AS daily_margin,
  COUNT(DISTINCT r.buyer_id) AS unique_buyers,
  COUNT(DISTINCT b.supplier_id) AS unique_suppliers
FROM public.requirements r
LEFT JOIN public.bids b ON b.requirement_id = r.id
GROUP BY DATE(r.created_at)
ORDER BY date DESC;

-- ============================================
-- SUPPLIER DASHBOARD VIEWS
-- ============================================

-- G) Supplier Inventory Performance View
CREATE VIEW public.supplier_inventory_performance AS
SELECT
  p.supplier_id,
  p.id AS product_id,
  p.name AS product_name,
  p.category,
  si.quantity AS current_stock,
  si.unit,
  COUNT(DISTINCT sim.id) AS ai_matches,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'accepted') AS deals_closed,
  COALESCE(SUM(b.dispatched_qty) FILTER (WHERE b.status = 'accepted'), 0) AS units_sold,
  COALESCE(SUM(b.supplier_net_price) FILTER (WHERE b.status = 'accepted'), 0) AS revenue_earned
FROM public.products p
LEFT JOIN public.stock_inventory si ON si.product_id = p.id
LEFT JOIN public.supplier_inventory_matches sim ON sim.product_id = p.id
LEFT JOIN public.bids b ON b.supplier_id = p.supplier_id
WHERE p.is_active = true
GROUP BY p.supplier_id, p.id, p.name, p.category, si.quantity, si.unit;

-- H) Supplier Deal Closures View (No margin exposed)
CREATE VIEW public.supplier_deal_closures AS
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
-- GRANT SELECT TO AUTHENTICATED USERS
-- ============================================
GRANT SELECT ON public.supplier_inventory_performance TO authenticated;
GRANT SELECT ON public.supplier_deal_closures TO authenticated;
GRANT SELECT ON public.admin_overview_metrics TO authenticated;
GRANT SELECT ON public.admin_profit_summary TO authenticated;
GRANT SELECT ON public.admin_deal_analytics TO authenticated;
GRANT SELECT ON public.admin_ai_inventory_suppliers TO authenticated;
GRANT SELECT ON public.admin_revenue_by_trade_type TO authenticated;
GRANT SELECT ON public.admin_daily_kpis TO authenticated;

-- ============================================
-- SECURITY FUNCTION FOR ADMIN CHECK
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- DOCUMENTATION COMMENTS
-- ============================================
COMMENT ON VIEW public.admin_overview_metrics IS 'Admin Control Tower: High-level RFQ and deal metrics';
COMMENT ON VIEW public.admin_profit_summary IS 'Admin Control Tower: Daily profit and GMV tracking';
COMMENT ON VIEW public.admin_deal_analytics IS 'Admin Control Tower: Detailed deal-level analytics';
COMMENT ON VIEW public.admin_ai_inventory_suppliers IS 'Admin Control Tower: AI inventory adoption by supplier';
COMMENT ON VIEW public.admin_revenue_by_trade_type IS 'Admin Control Tower: Revenue breakdown by trade type';
COMMENT ON VIEW public.admin_daily_kpis IS 'Admin Control Tower: Daily KPI dashboard data';
COMMENT ON VIEW public.supplier_inventory_performance IS 'Supplier Dashboard: Inventory and sales performance';
COMMENT ON VIEW public.supplier_deal_closures IS 'Supplier Dashboard: Deal history without margin exposure';