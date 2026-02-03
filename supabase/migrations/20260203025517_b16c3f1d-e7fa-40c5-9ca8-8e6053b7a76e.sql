-- ============================================================
-- PHASE-4: DEMAND FORECASTING, BUYER ACTIVATION, EXPORT DETECTION
-- ============================================================

-- 1. BUYER NUDGES TABLE
CREATE TABLE IF NOT EXISTS public.buyer_nudges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  nudge_type TEXT NOT NULL CHECK (nudge_type IN ('abandonment', 'partial_rfq', 'multi_session', 'category_suggestion')),
  trigger_reason TEXT NOT NULL,
  category TEXT,
  country TEXT,
  page_url TEXT,
  time_on_page_seconds INTEGER,
  nudge_content JSONB,
  is_delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  delivery_channel TEXT CHECK (delivery_channel IN ('email', 'push', 'in_app')),
  is_converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_buyer_nudges_user ON buyer_nudges(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_nudges_session ON buyer_nudges(session_id);
CREATE INDEX IF NOT EXISTS idx_buyer_nudges_type ON buyer_nudges(nudge_type);
CREATE INDEX IF NOT EXISTS idx_buyer_nudges_delivered ON buyer_nudges(is_delivered, created_at);

ALTER TABLE buyer_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nudges" ON buyer_nudges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all nudges" ON buyer_nudges
  FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert nudges" ON buyer_nudges
  FOR INSERT WITH CHECK (true);

-- 2. LANE AUCTIONS TABLE
CREATE TABLE IF NOT EXISTS public.lane_auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  intent_threshold INTEGER DEFAULT 8,
  auction_status TEXT DEFAULT 'open' CHECK (auction_status IN ('open', 'closed', 'awarded')),
  max_slots INTEGER DEFAULT 3,
  auction_start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  auction_end_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  winning_suppliers UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, country, auction_status)
);

-- 3. AUCTION BIDS TABLE
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES lane_auctions(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_tier TEXT CHECK (bid_tier IN ('premium', 'exclusive')),
  bid_status TEXT DEFAULT 'pending' CHECK (bid_status IN ('pending', 'accepted', 'rejected', 'outbid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auction_id, supplier_id)
);

ALTER TABLE lane_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open auctions" ON lane_auctions
  FOR SELECT USING (auction_status = 'open');

CREATE POLICY "Admin can manage auctions" ON lane_auctions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Suppliers can view own bids" ON auction_bids
  FOR SELECT USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can place bids" ON auction_bids
  FOR INSERT WITH CHECK (supplier_id = auth.uid());

-- 4. EXPORT DEMAND LANES TABLE
CREATE TABLE IF NOT EXISTS public.export_demand_lanes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_from TEXT NOT NULL,
  country_to TEXT NOT NULL,
  category TEXT NOT NULL,
  export_intent_score INTEGER DEFAULT 0,
  supplier_strength_score INTEGER DEFAULT 0,
  cross_border_score INTEGER DEFAULT 0,
  rfq_count INTEGER DEFAULT 0,
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lane_status TEXT DEFAULT 'detected' CHECK (lane_status IN ('detected', 'active', 'hot', 'closed')),
  suggested_suppliers UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(country_from, country_to, category)
);

CREATE INDEX IF NOT EXISTS idx_export_lanes_countries ON export_demand_lanes(country_from, country_to);
CREATE INDEX IF NOT EXISTS idx_export_lanes_score ON export_demand_lanes(cross_border_score DESC);

ALTER TABLE export_demand_lanes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view export lanes" ON export_demand_lanes
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage export lanes" ON export_demand_lanes
  FOR ALL USING (public.is_admin());

-- 5. EARLY ACCESS WINDOWS TABLE
CREATE TABLE IF NOT EXISTS public.early_access_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  country TEXT,
  freeze_start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  freeze_end_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '72 hours'),
  exclusive_tier TEXT DEFAULT 'premium' CHECK (exclusive_tier IN ('premium', 'exclusive')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, country)
);

ALTER TABLE early_access_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Premium can see early access" ON early_access_windows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM supplier_demand_access 
      WHERE supplier_id = auth.uid() 
      AND access_tier IN ('premium', 'exclusive')
    )
  );

-- 6. DEMAND FORECASTING FUNCTION
CREATE OR REPLACE FUNCTION public.get_forecast_demand(
  p_category TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  category TEXT,
  country TEXT,
  projected_intent NUMERIC,
  projected_rfqs INTEGER,
  velocity_score NUMERIC,
  trend_7d NUMERIC,
  trend_30d NUMERIC,
  confidence_score NUMERIC,
  forecast_date DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_date DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  WITH daily_signals AS (
    SELECT 
      dis.category,
      dis.country,
      DATE(dis.created_at) as signal_date,
      CEIL(SUM(dis.intent_score * 10)) as daily_intent,
      COUNT(CASE WHEN dis.converted_to_rfq_id IS NOT NULL THEN 1 END) as daily_rfqs
    FROM demand_intelligence_signals dis
    WHERE dis.created_at >= v_base_date - INTERVAL '60 days'
      AND (p_category IS NULL OR dis.category = p_category)
      AND (p_country IS NULL OR dis.country = p_country)
    GROUP BY dis.category, dis.country, DATE(dis.created_at)
  ),
  weighted_avg AS (
    SELECT 
      ds.category,
      ds.country,
      SUM(ds.daily_intent * POWER(0.95, v_base_date - ds.signal_date)) / 
        NULLIF(SUM(POWER(0.95, v_base_date - ds.signal_date)), 0) as weighted_intent,
      AVG(ds.daily_rfqs)::INTEGER as avg_rfqs,
      REGR_SLOPE(ds.daily_intent, EXTRACT(EPOCH FROM ds.signal_date)) FILTER (
        WHERE ds.signal_date >= v_base_date - INTERVAL '7 days'
      ) as slope_7d,
      REGR_SLOPE(ds.daily_intent, EXTRACT(EPOCH FROM ds.signal_date)) FILTER (
        WHERE ds.signal_date >= v_base_date - INTERVAL '30 days'
      ) as slope_30d,
      STDDEV(ds.daily_intent) as intent_stddev,
      COUNT(*) as data_points
    FROM daily_signals ds
    GROUP BY ds.category, ds.country
  )
  SELECT 
    wa.category,
    wa.country,
    LEAST(10, GREATEST(0, 
      COALESCE(wa.weighted_intent, 0) + 
      COALESCE(wa.slope_7d * 86400 * p_days, 0)
    ))::NUMERIC as projected_intent,
    GREATEST(0, COALESCE(wa.avg_rfqs, 0) + 
      CASE WHEN wa.slope_7d > 0 THEN CEIL(wa.slope_7d * p_days / 100) ELSE 0 END
    )::INTEGER as projected_rfqs,
    CASE 
      WHEN wa.slope_7d IS NULL THEN 0
      WHEN wa.slope_7d > 0 THEN LEAST(10, wa.slope_7d * 1000)
      ELSE GREATEST(-10, wa.slope_7d * 1000)
    END::NUMERIC as velocity_score,
    COALESCE(wa.slope_7d * 7 * 100, 0)::NUMERIC as trend_7d,
    COALESCE(wa.slope_30d * 30 * 100, 0)::NUMERIC as trend_30d,
    LEAST(100, GREATEST(0,
      (wa.data_points * 2) - COALESCE(wa.intent_stddev * 5, 0)
    ))::NUMERIC as confidence_score,
    (v_base_date + p_days)::DATE as forecast_date
  FROM weighted_avg wa
  WHERE wa.data_points >= 3
  ORDER BY projected_intent DESC;
END;
$$;

-- 7. EXPORT BUYER DETECTION FUNCTION
CREATE OR REPLACE FUNCTION public.detect_export_buyers(
  p_country_from TEXT DEFAULT NULL,
  p_country_to TEXT DEFAULT NULL,
  p_threshold INTEGER DEFAULT 5
)
RETURNS TABLE (
  country_from TEXT,
  country_to TEXT,
  category TEXT,
  buyer_intent_score INTEGER,
  supplier_strength_score INTEGER,
  cross_border_score INTEGER,
  rfq_count BIGINT,
  suggested_suppliers UUID[],
  lane_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO export_demand_lanes (
    country_from, country_to, category, 
    export_intent_score, supplier_strength_score, 
    cross_border_score, rfq_count, last_activity_at
  )
  SELECT 
    p.country as country_from,
    dis.country as country_to,
    dis.category,
    CEIL(AVG(dis.intent_score) * 10)::INTEGER as export_intent,
    COUNT(DISTINCT p.id)::INTEGER as supplier_strength,
    (CEIL(AVG(dis.intent_score) * 10) + COUNT(DISTINCT p.id))::INTEGER as cross_border,
    COUNT(dis.converted_to_rfq_id) as rfqs,
    now()
  FROM demand_intelligence_signals dis
  CROSS JOIN profiles p
  WHERE p.business_type = 'Supplier'
    AND p.supplier_categories && ARRAY[dis.category]
    AND dis.country != p.country
    AND (p_country_from IS NULL OR p.country = p_country_from)
    AND (p_country_to IS NULL OR dis.country = p_country_to)
    AND dis.created_at >= now() - INTERVAL '30 days'
  GROUP BY p.country, dis.country, dis.category
  HAVING CEIL(AVG(dis.intent_score) * 10) >= p_threshold
  ON CONFLICT (country_from, country_to, category) 
  DO UPDATE SET
    export_intent_score = EXCLUDED.export_intent_score,
    supplier_strength_score = EXCLUDED.supplier_strength_score,
    cross_border_score = EXCLUDED.cross_border_score,
    rfq_count = EXCLUDED.rfq_count,
    last_activity_at = now(),
    lane_status = CASE 
      WHEN EXCLUDED.cross_border_score >= 15 THEN 'hot'
      WHEN EXCLUDED.cross_border_score >= 8 THEN 'active'
      ELSE 'detected'
    END;

  RETURN QUERY
  SELECT 
    edl.country_from,
    edl.country_to,
    edl.category,
    edl.export_intent_score,
    edl.supplier_strength_score,
    edl.cross_border_score,
    edl.rfq_count::BIGINT,
    edl.suggested_suppliers,
    edl.lane_status
  FROM export_demand_lanes edl
  WHERE (p_country_from IS NULL OR edl.country_from = p_country_from)
    AND (p_country_to IS NULL OR edl.country_to = p_country_to)
    AND edl.cross_border_score >= p_threshold
  ORDER BY edl.cross_border_score DESC;
END;
$$;

-- 8. BUYER NUDGE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.create_buyer_nudge(
  p_user_id UUID,
  p_session_id TEXT,
  p_nudge_type TEXT,
  p_trigger_reason TEXT,
  p_category TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_time_on_page INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nudge_id UUID;
  v_recent_nudge_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent_nudge_count
  FROM buyer_nudges
  WHERE (user_id = p_user_id OR session_id = p_session_id)
    AND nudge_type = p_nudge_type
    AND created_at >= now() - INTERVAL '24 hours';

  IF v_recent_nudge_count >= 2 THEN
    RETURN NULL;
  END IF;

  INSERT INTO buyer_nudges (
    user_id, session_id, nudge_type, trigger_reason,
    category, country, page_url, time_on_page_seconds,
    nudge_content
  )
  VALUES (
    p_user_id, p_session_id, p_nudge_type, p_trigger_reason,
    p_category, p_country, p_page_url, p_time_on_page,
    jsonb_build_object(
      'title', CASE p_nudge_type
        WHEN 'abandonment' THEN 'Complete Your Inquiry'
        WHEN 'partial_rfq' THEN 'Finish Your RFQ'
        WHEN 'multi_session' THEN 'Ready to Get Quotes?'
        WHEN 'category_suggestion' THEN 'Similar Products Available'
      END,
      'message', CASE p_nudge_type
        WHEN 'abandonment' THEN 'You were looking at ' || COALESCE(p_category, 'products') || '. Get quotes from verified suppliers!'
        WHEN 'partial_rfq' THEN 'Your RFQ is almost ready. Complete it to receive competitive quotes.'
        WHEN 'multi_session' THEN 'You have visited us multiple times. Let us help you find the best suppliers.'
        WHEN 'category_suggestion' THEN 'Buyers like you also inquired about related products.'
      END,
      'cta', 'Get Quotes Now',
      'category', p_category
    )
  )
  RETURNING id INTO v_nudge_id;

  RETURN v_nudge_id;
END;
$$;

-- 9. DYNAMIC INTENT THRESHOLD FUNCTION
CREATE OR REPLACE FUNCTION public.get_dynamic_intent_threshold(
  p_category TEXT,
  p_country TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_threshold INTEGER := 4;
  v_velocity NUMERIC;
  v_dynamic_threshold INTEGER;
BEGIN
  SELECT velocity_score INTO v_velocity
  FROM get_forecast_demand(p_category, p_country, 7)
  LIMIT 1;

  v_dynamic_threshold := v_base_threshold + CASE
    WHEN COALESCE(v_velocity, 0) >= 8 THEN 2
    WHEN COALESCE(v_velocity, 0) >= 5 THEN 1
    ELSE 0
  END;

  RETURN LEAST(8, v_dynamic_threshold);
END;
$$;

-- 10. EXTEND DEMAND ALERTS WITH NEW TYPES
ALTER TABLE demand_alerts 
  DROP CONSTRAINT IF EXISTS demand_alerts_alert_type_check;

ALTER TABLE demand_alerts 
  ADD CONSTRAINT demand_alerts_alert_type_check 
  CHECK (alert_type IN (
    'intent_threshold', 'rfq_spike', 'cross_country_spike',
    'forecast_spike', 'export_demand', 'velocity_jump'
  ));

-- 11. FORECAST ALERTS FUNCTION (simplified counting)
CREATE OR REPLACE FUNCTION public.check_and_create_forecast_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count1 INTEGER;
  v_count2 INTEGER;
  v_count3 INTEGER;
BEGIN
  -- Forecast spike alerts
  WITH inserted AS (
    INSERT INTO demand_alerts (
      alert_type, category, country, intent_score, 
      rfq_count, time_window_hours, suggested_action
    )
    SELECT 
      'forecast_spike',
      fd.category,
      fd.country,
      fd.projected_intent::INTEGER,
      fd.projected_rfqs,
      168,
      'Prepare supplier capacity for projected demand surge in ' || fd.category
    FROM get_forecast_demand(NULL, NULL, 7) fd
    WHERE fd.projected_intent >= 8
      AND fd.confidence_score >= 50
      AND NOT EXISTS (
        SELECT 1 FROM demand_alerts da
        WHERE da.category = fd.category
          AND da.country = fd.country
          AND da.alert_type = 'forecast_spike'
          AND da.created_at >= now() - INTERVAL '48 hours'
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count1 FROM inserted;

  -- Velocity jump alerts
  WITH inserted AS (
    INSERT INTO demand_alerts (
      alert_type, category, country, intent_score, 
      rfq_count, time_window_hours, suggested_action
    )
    SELECT 
      'velocity_jump',
      fd.category,
      fd.country,
      fd.velocity_score::INTEGER,
      fd.projected_rfqs,
      24,
      'Rapid demand acceleration detected for ' || fd.category || ' - activate priority suppliers'
    FROM get_forecast_demand(NULL, NULL, 7) fd
    WHERE fd.velocity_score >= 7
      AND NOT EXISTS (
        SELECT 1 FROM demand_alerts da
        WHERE da.category = fd.category
          AND da.country = fd.country
          AND da.alert_type = 'velocity_jump'
          AND da.created_at >= now() - INTERVAL '24 hours'
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count2 FROM inserted;

  -- Export demand alerts
  WITH inserted AS (
    INSERT INTO demand_alerts (
      alert_type, category, country, intent_score, 
      rfq_count, time_window_hours, suggested_action,
      countries_affected
    )
    SELECT 
      'export_demand',
      edl.category,
      edl.country_to,
      edl.cross_border_score,
      edl.rfq_count::INTEGER,
      72,
      'Cross-border demand from ' || edl.country_from || ' to ' || edl.country_to || ' for ' || edl.category,
      ARRAY[edl.country_from, edl.country_to]
    FROM export_demand_lanes edl
    WHERE edl.cross_border_score >= 10
      AND edl.last_activity_at >= now() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM demand_alerts da
        WHERE da.category = edl.category
          AND da.country = edl.country_to
          AND da.alert_type = 'export_demand'
          AND da.created_at >= now() - INTERVAL '48 hours'
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count3 FROM inserted;

  RETURN COALESCE(v_count1, 0) + COALESCE(v_count2, 0) + COALESCE(v_count3, 0);
END;
$$;