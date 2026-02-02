-- Drop existing function and recreate with correct logic
DROP FUNCTION IF EXISTS public.get_demand_intelligence_grid(INT);

CREATE OR REPLACE FUNCTION public.get_demand_intelligence_grid(
  p_days_back INT DEFAULT 7
)
RETURNS TABLE (
  category TEXT,
  country TEXT,
  intent INT,
  rfqs INT,
  state TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    category,
    country,
    CEIL(SUM(intent_score * 10))::INT AS intent,
    COUNT(*) FILTER (
      WHERE classification = 'buy'
         OR lane_state = 'rfq_submitted'
    ) AS rfqs,
    CASE
      WHEN CEIL(SUM(intent_score * 10)) >= 7 THEN 'Active'
      WHEN CEIL(SUM(intent_score * 10)) >= 4 THEN 'Confirmed'
      ELSE 'Detected'
    END AS state
  FROM demand_intelligence_signals
  WHERE discovered_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND country IN ('IN', 'AE', 'NG', 'KE')
  GROUP BY category, country
  ORDER BY intent DESC;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_demand_intelligence_grid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_demand_intelligence_grid TO anon;