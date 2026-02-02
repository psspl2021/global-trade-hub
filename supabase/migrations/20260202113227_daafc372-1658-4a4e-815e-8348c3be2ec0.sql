-- Create the proper aggregation function for Demand Intelligence Grid
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
SECURITY DEFINER
AS $$
  SELECT
    category,
    country,
    GREATEST(1, ROUND(SUM(intent_score * 10)))::INT AS intent,
    COUNT(*) FILTER (WHERE classification = 'buy' OR classification = 'procurement') AS rfqs,
    MAX(lane_state) AS state
  FROM demand_intelligence_signals
  WHERE discovered_at >= now() - (p_days_back || ' days')::interval
    AND classification IN ('buy', 'procurement', 'supplier', 'category')
    AND country IN ('IN','AE','NG','KE')
  GROUP BY category, country
  ORDER BY intent DESC;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_demand_intelligence_grid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_demand_intelligence_grid TO anon;