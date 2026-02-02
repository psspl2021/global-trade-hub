-- Create a function to get aggregated demand signals for the dashboard
CREATE OR REPLACE FUNCTION get_aggregated_demand_signals(
  p_country TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_subcategory TEXT DEFAULT NULL,
  p_days_back INT DEFAULT 7
)
RETURNS TABLE (
  category TEXT,
  subcategory TEXT,
  country TEXT,
  intent INT,
  rfqs INT,
  signal_count BIGINT,
  best_state TEXT,
  last_signal_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dis.category,
    dis.subcategory,
    dis.country,
    ROUND(COALESCE(SUM(dis.intent_score * 10), 0))::INT AS intent,
    COALESCE(SUM(CASE WHEN dis.classification = 'buy' OR dis.lane_state = 'rfq_submitted' THEN 1 ELSE 0 END), 0)::INT AS rfqs,
    COUNT(*)::BIGINT AS signal_count,
    MAX(dis.lane_state) AS best_state,
    MAX(dis.discovered_at) AS last_signal_at
  FROM demand_intelligence_signals dis
  WHERE dis.discovered_at > now() - (p_days_back || ' days')::INTERVAL
    AND (p_country IS NULL OR dis.country = p_country)
    AND (p_category IS NULL OR dis.category = p_category)
    AND (p_subcategory IS NULL OR dis.subcategory = p_subcategory)
  GROUP BY dis.category, dis.subcategory, dis.country
  ORDER BY intent DESC, signal_count DESC
  LIMIT 500;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_aggregated_demand_signals TO authenticated;
GRANT EXECUTE ON FUNCTION get_aggregated_demand_signals TO anon;