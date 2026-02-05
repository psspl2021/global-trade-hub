-- ============================================================
-- FIX: Remove * 10 multiplier (intent is already 1-10 scale)
-- ADD: Cron scheduler for automatic alert generation
-- ============================================================

-- Function: Check and Create Demand Alerts (FIXED SCALING)
CREATE OR REPLACE FUNCTION public.check_and_create_demand_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alerts_created INTEGER := 0;
  v_row RECORD;
  v_exists BOOLEAN;
BEGIN
  -- 1. High Intent Alerts (intent >= 7)
  FOR v_row IN
    SELECT 
      dis.category,
      dis.country,
      COALESCE(SUM(dis.intent_score), 0)::INTEGER as total_intent,
      COUNT(*) as signal_count
    FROM demand_intelligence_signals dis
    WHERE dis.discovered_at >= NOW() - INTERVAL '7 days'
    GROUP BY dis.category, dis.country
    HAVING COALESCE(SUM(dis.intent_score), 0) >= 7
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM demand_alerts
      WHERE category = v_row.category
      AND country = v_row.country
      AND alert_type = 'intent_threshold'
      AND created_at >= NOW() - INTERVAL '24 hours'
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      INSERT INTO demand_alerts (
        alert_type, category, country, intent_score, 
        suggested_action
      ) VALUES (
        'intent_threshold', 
        v_row.category, 
        v_row.country, 
        v_row.total_intent,
        'High buyer intent detected. Consider activating lane for ' || v_row.category || ' in ' || v_row.country
      );
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END LOOP;

  -- 2. RFQ Spike Alerts (>= 3 RFQs in 72h)
  FOR v_row IN
    SELECT 
      product_category as category,
      COALESCE(destination_country, 'IN') as country,
      COUNT(*)::INTEGER as rfq_count
    FROM requirements
    WHERE created_at >= NOW() - INTERVAL '72 hours'
    AND status = 'active'
    GROUP BY product_category, COALESCE(destination_country, 'IN')
    HAVING COUNT(*) >= 3
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM demand_alerts
      WHERE category = v_row.category
      AND country = v_row.country
      AND alert_type = 'rfq_spike'
      AND created_at >= NOW() - INTERVAL '24 hours'
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      INSERT INTO demand_alerts (
        alert_type, category, country, rfq_count,
        suggested_action
      ) VALUES (
        'rfq_spike',
        v_row.category,
        v_row.country,
        v_row.rfq_count,
        'RFQ spike detected: ' || v_row.rfq_count || ' new requests. Prioritize supplier outreach.'
      );
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END LOOP;

  -- 3. Cross-Country Alerts (same category in >= 2 countries)
  FOR v_row IN
    SELECT 
      dis.category,
      COUNT(DISTINCT dis.country) as country_count,
      MAX(COALESCE(dis.intent_score, 0))::INTEGER as max_intent
    FROM demand_intelligence_signals dis
    WHERE dis.discovered_at >= NOW() - INTERVAL '7 days'
    GROUP BY dis.category
    HAVING COUNT(DISTINCT dis.country) >= 2
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM demand_alerts
      WHERE category = v_row.category
      AND alert_type = 'cross_country_spike'
      AND created_at >= NOW() - INTERVAL '24 hours'
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      INSERT INTO demand_alerts (
        alert_type, category, country, intent_score,
        suggested_action
      ) VALUES (
        'cross_country_spike',
        v_row.category,
        'GLOBAL',
        COALESCE(v_row.max_intent, 0),
        'Cross-country demand for ' || v_row.category || ' in ' || v_row.country_count || ' countries. Consider global lane activation.'
      );
      v_alerts_created := v_alerts_created + 1;
    END IF;
  END LOOP;

  -- Auto-expire old alerts
  UPDATE demand_alerts
  SET is_actioned = true
  WHERE expires_at < NOW()
  AND is_actioned = false;

  RETURN v_alerts_created;
END;
$$;

-- Function: Get Supplier Visible Demand (FIXED SCALING)
CREATE OR REPLACE FUNCTION public.get_supplier_visible_demand(
  p_supplier_id UUID,
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE(
  category TEXT,
  country TEXT,
  intent INTEGER,
  rfqs INTEGER,
  source TEXT,
  is_locked BOOLEAN,
  can_access BOOLEAN,
  access_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_tier TEXT := 'free';
  v_min_intent INTEGER := 4;
BEGIN
  SELECT COALESCE(sda.access_tier, 'free'),
    CASE 
      WHEN sda.access_tier = 'free' THEN 4
      WHEN sda.access_tier = 'premium' THEN 0
      WHEN sda.access_tier = 'exclusive' THEN 0
      ELSE 4
    END
  INTO v_access_tier, v_min_intent
  FROM supplier_demand_access sda
  WHERE sda.supplier_id = p_supplier_id
  AND (sda.expires_at IS NULL OR sda.expires_at > NOW());

  RETURN QUERY
  WITH aggregated AS (
    SELECT 
      dis.category,
      dis.country,
      COALESCE(SUM(dis.intent_score), 0)::INTEGER as total_intent
    FROM demand_intelligence_signals dis
    WHERE dis.discovered_at >= NOW() - (p_days_back || ' days')::INTERVAL
    GROUP BY dis.category, dis.country
  ),
  with_rfqs AS (
    SELECT 
      a.category,
      a.country,
      a.total_intent,
      COALESCE(r.rfq_count, 0)::INTEGER as rfq_count
    FROM aggregated a
    LEFT JOIN (
      SELECT 
        product_category as category,
        COALESCE(destination_country, 'IN') as country,
        COUNT(*)::INTEGER as rfq_count
      FROM requirements
      WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND status = 'active'
      GROUP BY product_category, COALESCE(destination_country, 'IN')
    ) r ON a.category = r.category AND a.country = r.country
  ),
  with_locks AS (
    SELECT 
      wr.*,
      COALESCE(dll.is_locked, false) as lane_locked,
      EXISTS(
        SELECT 1 FROM lane_supplier_assignments lsa
        WHERE lsa.lane_id = dll.id
        AND lsa.supplier_id = p_supplier_id
        AND lsa.is_active = true
      ) as is_assigned
    FROM with_rfqs wr
    LEFT JOIN demand_lane_locks dll 
      ON wr.category = dll.category AND wr.country = dll.country
  )
  SELECT 
    wl.category,
    wl.country,
    wl.total_intent as intent,
    CASE WHEN v_access_tier = 'free' THEN 0 ELSE wl.rfq_count END as rfqs,
    'signal'::TEXT as source,
    wl.lane_locked as is_locked,
    CASE
      WHEN v_access_tier = 'exclusive' THEN true
      WHEN v_access_tier = 'premium' THEN NOT wl.lane_locked OR wl.is_assigned
      WHEN wl.total_intent < v_min_intent THEN true
      ELSE false
    END as can_access,
    CASE
      WHEN v_access_tier = 'exclusive' THEN 'Exclusive access'
      WHEN v_access_tier = 'premium' AND wl.lane_locked AND NOT wl.is_assigned THEN 'Lane locked - upgrade to exclusive'
      WHEN v_access_tier = 'premium' THEN 'Premium access'
      WHEN wl.total_intent >= v_min_intent THEN 'Upgrade to premium for high-intent demand'
      ELSE 'Free tier access'
    END as access_reason
  FROM with_locks wl
  ORDER BY wl.total_intent DESC;
END;
$$;