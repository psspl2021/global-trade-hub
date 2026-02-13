
-- 1. Normalize existing country data to uppercase ISO-style
UPDATE demand_intelligence_signals SET country = UPPER(TRIM(country)) WHERE country IS NOT NULL;
UPDATE demand_intelligence_signals SET country = 'IN' WHERE UPPER(country) IN ('INDIA', 'IND');

-- 2. Fix lane_state 'pending_activation' to canonical 'pending'
UPDATE demand_intelligence_signals SET lane_state = 'pending' WHERE lane_state = 'pending_activation';

-- 3. Create function to recalculate intent scores dynamically
CREATE OR REPLACE FUNCTION public.recalculate_intent_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
  sig RECORD;
  new_intent numeric;
  rfq_count integer;
  signal_age_days numeric;
  category_demand integer;
  country_demand integer;
BEGIN
  FOR sig IN
    SELECT id, category, country, signal_source, confidence_score,
           estimated_value, created_at, lane_state, intent_score
    FROM demand_intelligence_signals
    WHERE lane_state NOT IN ('closed', 'lost')
  LOOP
    -- Base score from signal source
    new_intent := CASE sig.signal_source
      WHEN 'rfq' THEN 4.0
      WHEN 'rfq_award' THEN 6.0
      WHEN 'signal_page' THEN 2.0
      WHEN 'seo' THEN 1.5
      WHEN 'search' THEN 2.5
      WHEN 'manual' THEN 3.0
      ELSE 1.0
    END;

    -- Count RFQs in same category+country in last 30 days
    SELECT COUNT(*) INTO rfq_count
    FROM requirements r
    WHERE r.product_category ILIKE '%' || REPLACE(sig.category, '-', '%') || '%'
      AND r.created_at >= NOW() - INTERVAL '30 days';

    -- RFQ volume boost (0 to +3)
    new_intent := new_intent + LEAST(rfq_count * 0.5, 3.0);

    -- Value boost (0 to +2)
    IF COALESCE(sig.estimated_value, 0) > 10000000 THEN
      new_intent := new_intent + 2.0;
    ELSIF COALESCE(sig.estimated_value, 0) > 1000000 THEN
      new_intent := new_intent + 1.0;
    ELSIF COALESCE(sig.estimated_value, 0) > 100000 THEN
      new_intent := new_intent + 0.5;
    END IF;

    -- Recency decay: signals older than 14 days lose points
    signal_age_days := EXTRACT(EPOCH FROM (NOW() - sig.created_at)) / 86400.0;
    IF signal_age_days > 30 THEN
      new_intent := new_intent - 2.0;
    ELSIF signal_age_days > 14 THEN
      new_intent := new_intent - 1.0;
    END IF;

    -- Category demand density: how many signals in this category
    SELECT COUNT(*) INTO category_demand
    FROM demand_intelligence_signals
    WHERE category = sig.category
      AND lane_state NOT IN ('closed', 'lost')
      AND id != sig.id;

    new_intent := new_intent + LEAST(category_demand * 0.3, 1.5);

    -- Country demand density
    SELECT COUNT(*) INTO country_demand
    FROM demand_intelligence_signals
    WHERE country = sig.country
      AND lane_state NOT IN ('closed', 'lost')
      AND id != sig.id;

    new_intent := new_intent + LEAST(country_demand * 0.2, 1.0);

    -- Confidence boost
    new_intent := new_intent * GREATEST(sig.confidence_score, 0.5);

    -- Clamp to 1-10
    new_intent := LEAST(GREATEST(new_intent, 1.0), 10.0);

    -- Update if changed
    IF ROUND(new_intent, 1) != COALESCE(ROUND(sig.intent_score, 1), 0) THEN
      UPDATE demand_intelligence_signals
      SET intent_score = ROUND(new_intent, 1),
          updated_at = NOW()
      WHERE id = sig.id;
      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RETURN updated_count;
END;
$$;

-- 4. Create function to activate a lane properly with validation
CREATE OR REPLACE FUNCTION public.activate_demand_lane(
  p_signal_id uuid,
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sig RECORD;
  result jsonb;
BEGIN
  -- Get signal
  SELECT * INTO sig FROM demand_intelligence_signals WHERE id = p_signal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Signal not found', 'code', 'NOT_FOUND');
  END IF;

  -- Validate state
  IF sig.lane_state IN ('closed', 'lost') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Signal is in terminal state: ' || sig.lane_state, 'code', 'TERMINAL_STATE');
  END IF;

  IF sig.lane_state = 'activated' OR sig.lane_state = 'fulfilling' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lane is already ' || sig.lane_state, 'code', 'ALREADY_ACTIVE');
  END IF;

  -- Activate
  UPDATE demand_intelligence_signals
  SET lane_state = 'activated',
      decision_action = 'activated',
      activated_at = NOW(),
      decision_made_at = NOW(),
      decision_made_by = p_admin_id,
      updated_at = NOW()
  WHERE id = p_signal_id;

  -- Write audit event
  INSERT INTO lane_events (signal_id, event_type, country, category, from_state, to_state, actor, occurred_at, metadata)
  VALUES (
    p_signal_id,
    'LANE_STATE_CHANGED',
    sig.country,
    sig.category,
    COALESCE(sig.lane_state, 'detected'),
    'activated',
    'admin',
    NOW(),
    jsonb_build_object('admin_id', p_admin_id::text, 'previous_decision', sig.decision_action)
  );

  RETURN jsonb_build_object(
    'success', true,
    'signal_id', p_signal_id,
    'from_state', COALESCE(sig.lane_state, 'detected'),
    'to_state', 'activated',
    'country', sig.country,
    'category', sig.category
  );
END;
$$;

-- 5. Create function to get real dashboard metrics
CREATE OR REPLACE FUNCTION public.get_demand_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_active_signals integer;
  v_active_lanes integer;
  v_revenue_at_risk numeric;
  v_capacity_utilization numeric;
  v_demand_capacity_gap numeric;
  v_avg_time_to_monetise numeric;
  v_rfqs_7d integer;
  v_top_country text;
  v_top_country_score numeric;
  v_top_category text;
  v_top_category_score numeric;
BEGIN
  -- Active signals (not closed/lost)
  SELECT COUNT(*) INTO v_active_signals
  FROM demand_intelligence_signals
  WHERE lane_state NOT IN ('closed', 'lost');

  -- Active lanes (activated or fulfilling)
  SELECT COUNT(DISTINCT country || '-' || category) INTO v_active_lanes
  FROM demand_intelligence_signals
  WHERE lane_state IN ('activated', 'fulfilling');

  -- Revenue at risk (detected/pending signals with estimated value)
  SELECT COALESCE(SUM(estimated_value), 0) INTO v_revenue_at_risk
  FROM demand_intelligence_signals
  WHERE lane_state IN ('detected', 'pending')
    AND estimated_value IS NOT NULL;

  -- Capacity utilization from supplier_capacity_lanes
  SELECT COALESCE(
    AVG(
      CASE WHEN monthly_capacity_value > 0
        THEN (allocated_capacity_value / monthly_capacity_value) * 100
        ELSE 0
      END
    ), 0
  ) INTO v_capacity_utilization
  FROM supplier_capacity_lanes
  WHERE active = true;

  -- Demand-capacity gap
  SELECT COALESCE(SUM(
    CASE 
      WHEN scl.id IS NULL THEN dis.estimated_value
      WHEN dis.estimated_value > (scl.monthly_capacity_value - scl.allocated_capacity_value) 
        THEN dis.estimated_value - (scl.monthly_capacity_value - scl.allocated_capacity_value)
      ELSE 0
    END
  ), 0) INTO v_demand_capacity_gap
  FROM demand_intelligence_signals dis
  LEFT JOIN supplier_capacity_lanes scl 
    ON UPPER(scl.country) = UPPER(dis.country) 
    AND scl.category = dis.category 
    AND scl.active = true
  WHERE dis.lane_state NOT IN ('closed', 'lost')
    AND dis.estimated_value IS NOT NULL;

  -- Avg time to monetise (activated_at - created_at for activated/fulfilling/closed lanes)
  SELECT COALESCE(AVG(
    EXTRACT(EPOCH FROM (activated_at - created_at)) / 86400.0
  ), 0) INTO v_avg_time_to_monetise
  FROM demand_intelligence_signals
  WHERE activated_at IS NOT NULL
    AND created_at IS NOT NULL
    AND activated_at > created_at;

  -- RFQs in last 7 days
  SELECT COUNT(*) INTO v_rfqs_7d
  FROM requirements
  WHERE created_at >= NOW() - INTERVAL '7 days';

  -- Top country by intent
  SELECT country, SUM(intent_score) INTO v_top_country, v_top_country_score
  FROM demand_intelligence_signals
  WHERE lane_state NOT IN ('closed', 'lost')
    AND intent_score IS NOT NULL
  GROUP BY country
  ORDER BY SUM(intent_score) DESC
  LIMIT 1;

  -- Top category by intent
  SELECT category, SUM(intent_score) INTO v_top_category, v_top_category_score
  FROM demand_intelligence_signals
  WHERE lane_state NOT IN ('closed', 'lost')
    AND intent_score IS NOT NULL
  GROUP BY category
  ORDER BY SUM(intent_score) DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'active_signals', v_active_signals,
    'active_lanes', v_active_lanes,
    'revenue_at_risk', v_revenue_at_risk,
    'capacity_utilization', ROUND(v_capacity_utilization, 1),
    'demand_capacity_gap', v_demand_capacity_gap,
    'avg_time_to_monetise', ROUND(v_avg_time_to_monetise, 1),
    'rfqs_7d', v_rfqs_7d,
    'top_country', v_top_country,
    'top_country_score', v_top_country_score,
    'top_category', v_top_category,
    'top_category_score', v_top_category_score
  );
END;
$$;
