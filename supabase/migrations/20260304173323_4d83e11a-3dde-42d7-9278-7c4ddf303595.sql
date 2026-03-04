
-- 1. SKU to Industry mapping table
CREATE TABLE IF NOT EXISTS sku_industry_mapping (
  sku_slug text PRIMARY KEY,
  industry_slug text NOT NULL,
  sub_cluster text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sku_industry_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_industry_mapping FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admin read sku_industry_mapping"
ON sku_industry_mapping FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed initial mappings
INSERT INTO sku_industry_mapping (sku_slug, industry_slug, sub_cluster) VALUES
  ('tmt-bars-india', 'metals', 'ferrous'),
  ('structural-steel-india', 'metals', 'ferrous'),
  ('hr-coil-india', 'metals', 'ferrous'),
  ('ms-plates-india', 'metals', 'ferrous'),
  ('aluminium-ingots-india', 'metals', 'non-ferrous'),
  ('ferro-manganese-india', 'metals', 'ferro-alloys'),
  ('ferro-silicon-india', 'metals', 'ferro-alloys'),
  ('ferro-chrome-india', 'metals', 'ferro-alloys'),
  ('pp-granules-india', 'polymers', 'commodity'),
  ('hdpe-granules-india', 'polymers', 'commodity'),
  ('pvc-resin-india', 'polymers', 'commodity'),
  ('abs-granules-india', 'polymers', 'engineering')
ON CONFLICT (sku_slug) DO NOTHING;

-- 2. Composite Corridor Intelligence View
CREATE OR REPLACE VIEW admin_corridor_intelligence AS
SELECT
  sku_slug,
  country_slug,
  source_page_type,
  count(*) AS rfq_count,
  coalesce(sum(revenue_value), 0) AS total_revenue,
  count(*) * 0.4 + coalesce(sum(revenue_value), 0) * 0.4 AS revenue_component
FROM rfq_revenue_attribution
GROUP BY 1, 2, 3;

-- 3. Industry Revenue Rollup
CREATE OR REPLACE VIEW admin_industry_revenue AS
SELECT
  i.industry_slug,
  i.sub_cluster,
  coalesce(sum(r.revenue_value), 0) AS total_revenue,
  count(r.id) AS total_rfqs
FROM rfq_revenue_attribution r
JOIN sku_industry_mapping i ON r.sku_slug = i.sku_slug
GROUP BY 1, 2;

-- 4. 7 Day Trend
CREATE OR REPLACE VIEW admin_revenue_trend_7d AS
SELECT
  date_trunc('day', created_at) AS day,
  coalesce(sum(revenue_value), 0) AS revenue,
  count(*) AS rfqs
FROM rfq_revenue_attribution
WHERE created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY 1;

-- 5. 30 Day Trend
CREATE OR REPLACE VIEW admin_revenue_trend_30d AS
SELECT
  date_trunc('day', created_at) AS day,
  coalesce(sum(revenue_value), 0) AS revenue,
  count(*) AS rfqs
FROM rfq_revenue_attribution
WHERE created_at >= now() - interval '30 days'
GROUP BY 1
ORDER BY 1;

-- 6. GSC + Revenue Overlay
CREATE OR REPLACE VIEW admin_seo_funnel AS
SELECT
  g.query AS keyword,
  g.page_slug AS landing_page,
  g.position,
  g.clicks,
  count(r.id) AS rfqs,
  coalesce(sum(r.revenue_value), 0) AS revenue
FROM gsc_striking_distance g
LEFT JOIN rfq_revenue_attribution r
  ON r.page_path LIKE '%' || g.page_slug || '%'
WHERE g.is_active = true
GROUP BY 1, 2, 3, 4;

-- 7. Fix RLS: drop public read, add admin-only
DROP POLICY IF EXISTS "Public read rfq_revenue_attribution" ON rfq_revenue_attribution;

CREATE POLICY "Admin only revenue read"
ON rfq_revenue_attribution FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
