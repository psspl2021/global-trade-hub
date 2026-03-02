
CREATE OR REPLACE VIEW public.seo_revenue_dashboard AS
SELECT
  sku_slug,
  country_slug,
  source_page_type,
  count(*) AS rfq_count,
  sum(revenue_value) AS total_revenue
FROM public.rfq_revenue_attribution
GROUP BY sku_slug, country_slug, source_page_type;
