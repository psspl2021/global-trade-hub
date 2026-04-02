CREATE OR REPLACE VIEW public.demand_revenue_dashboard AS
SELECT
  slug,
  COUNT(*) FILTER (WHERE event_type = 'view') AS views,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view') AS unique_visitors,
  COUNT(*) FILTER (WHERE event_type = 'rfq_click') AS rfq_clicks,
  CASE 
    WHEN COUNT(*) FILTER (WHERE event_type = 'view') > 0
    THEN ROUND(
      (COUNT(*) FILTER (WHERE event_type = 'rfq_click')::numeric /
       COUNT(*) FILTER (WHERE event_type = 'view')) * 100, 2
    )
    ELSE 0
  END AS conversion_rate,
  MAX(created_at) AS last_activity_at,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'rfq_click') * 10) +
    (COUNT(*) FILTER (WHERE event_type = 'view') * 0.2),
    2
  ) AS revenue_score
FROM public.demand_page_analytics
GROUP BY slug;