
-- Fix admin_profit_summary view to include all accepted deals and calculate profit properly
DROP VIEW IF EXISTS admin_profit_summary;
CREATE OR REPLACE VIEW admin_profit_summary AS
SELECT 
  DATE(COALESCE(awarded_at, created_at)) AS date,
  SUM(COALESCE(platform_margin, 0) + COALESCE(markup_amount, 0)) AS total_profit,
  COUNT(*) AS deals_closed,
  SUM(COALESCE(total_amount, buyer_visible_price, 0)) AS total_gmv,
  AVG(COALESCE(platform_margin, 0) + COALESCE(markup_amount, 0)) AS avg_margin_per_deal
FROM bids
WHERE status = 'accepted'
GROUP BY DATE(COALESCE(awarded_at, created_at))
ORDER BY date DESC;

-- Fix admin_overview_metrics view to count deals from bids table (accepted bids = deals)
DROP VIEW IF EXISTS admin_overview_metrics;
CREATE OR REPLACE VIEW admin_overview_metrics AS
SELECT
  (SELECT COUNT(*) FROM requirements WHERE rfq_source = 'ai_inventory') AS ai_inventory_requirements,
  (SELECT COUNT(*) FROM requirements WHERE COALESCE(rfq_source, 'manual') != 'ai_inventory') AS manual_requirements,
  (SELECT COUNT(*) FROM requirements) AS total_requirements,
  (SELECT COUNT(DISTINCT buyer_id) FROM requirements) AS active_buyers,
  (SELECT COUNT(*) FROM requirements WHERE status = 'active') AS active_rfqs,
  (SELECT COUNT(*) FROM bids WHERE status = 'accepted') AS deals_closed,
  (SELECT COUNT(*) FROM bids WHERE status = 'accepted' AND closed_at IS NOT NULL) AS deals_completed,
  (SELECT COALESCE(SUM(total_amount), 0) FROM bids WHERE status = 'accepted') AS total_gmv,
  (SELECT COALESCE(SUM(COALESCE(platform_margin, 0) + COALESCE(markup_amount, 0)), 0) FROM bids WHERE status = 'accepted') AS total_profit;

-- Fix admin_daily_kpis view to use bid awarded_at for deals
DROP VIEW IF EXISTS admin_daily_kpis;
CREATE OR REPLACE VIEW admin_daily_kpis AS
WITH rfq_daily AS (
  SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS rfqs_created,
    COUNT(*) FILTER (WHERE rfq_source = 'ai_inventory') AS ai_rfqs,
    COUNT(DISTINCT buyer_id) AS unique_buyers
  FROM requirements
  GROUP BY DATE(created_at)
),
bid_daily AS (
  SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS bids_received,
    COUNT(DISTINCT supplier_id) AS unique_suppliers
  FROM bids
  GROUP BY DATE(created_at)
),
deal_daily AS (
  SELECT 
    DATE(COALESCE(awarded_at, created_at)) AS date,
    COUNT(*) AS deals_closed,
    SUM(COALESCE(platform_margin, 0) + COALESCE(markup_amount, 0)) AS daily_margin,
    SUM(COALESCE(total_amount, 0)) AS daily_gmv
  FROM bids
  WHERE status = 'accepted'
  GROUP BY DATE(COALESCE(awarded_at, created_at))
)
SELECT 
  COALESCE(r.date, b.date, d.date) AS date,
  COALESCE(r.rfqs_created, 0) AS rfqs_created,
  COALESCE(r.ai_rfqs, 0) AS ai_rfqs,
  COALESCE(b.bids_received, 0) AS bids_received,
  COALESCE(d.deals_closed, 0) AS deals_closed,
  COALESCE(d.daily_margin, 0) AS daily_margin,
  COALESCE(d.daily_gmv, 0) AS daily_gmv,
  COALESCE(r.unique_buyers, 0) AS unique_buyers,
  COALESCE(b.unique_suppliers, 0) AS unique_suppliers
FROM rfq_daily r
FULL OUTER JOIN bid_daily b ON r.date = b.date
FULL OUTER JOIN deal_daily d ON COALESCE(r.date, b.date) = d.date
ORDER BY date DESC;
