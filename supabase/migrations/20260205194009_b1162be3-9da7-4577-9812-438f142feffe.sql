
-- ============================================================
-- PHASE-3, 4, 5: COMPLETE DEMAND INTELLIGENCE SYSTEM
-- ============================================================

-- Create supplier_categories table first (needed for RLS policies)
CREATE TABLE IF NOT EXISTS public.supplier_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  category_name TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_slug)
);

ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own categories" ON public.supplier_categories;
DROP POLICY IF EXISTS "Users manage own categories" ON public.supplier_categories;

CREATE POLICY "Users view own categories" ON public.supplier_categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users manage own categories" ON public.supplier_categories
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_supplier_categories_user ON public.supplier_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_categories_slug ON public.supplier_categories(category_slug);

-- ============================================================
-- PHASE-3: AI DEMAND INTELLIGENCE & ALERTS
-- ============================================================

-- Demand Alerts Table (drop and recreate to ensure clean state)
DROP TABLE IF EXISTS public.demand_alerts CASCADE;

CREATE TABLE public.demand_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('intent_threshold', 'rfq_spike', 'cross_country_spike')),
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  intent_score INTEGER NOT NULL DEFAULT 0,
  rfq_count INTEGER NOT NULL DEFAULT 0,
  suggested_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_actioned BOOLEAN NOT NULL DEFAULT false,
  actioned_by UUID REFERENCES auth.users(id),
  actioned_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.demand_alerts ENABLE ROW LEVEL SECURITY;

-- Admin can see all alerts
CREATE POLICY "Admins can view all alerts" ON public.demand_alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admin can update alerts
CREATE POLICY "Admins can update alerts" ON public.demand_alerts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Suppliers can view alerts matching their categories
CREATE POLICY "Suppliers can view matching alerts" ON public.demand_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.supplier_categories sc
      WHERE sc.user_id = auth.uid()
      AND sc.category_slug = demand_alerts.category
    )
  );

CREATE INDEX idx_demand_alerts_category_country ON public.demand_alerts(category, country);
CREATE INDEX idx_demand_alerts_expires ON public.demand_alerts(expires_at) WHERE is_actioned = false;
CREATE INDEX idx_demand_alerts_type ON public.demand_alerts(alert_type);

-- ============================================================
-- PHASE-4: SUPPLIER MONETISATION ENGINE
-- ============================================================

-- Supplier Demand Access Table
DROP TABLE IF EXISTS public.lane_supplier_assignments CASCADE;
DROP TABLE IF EXISTS public.demand_lane_locks CASCADE;
DROP TABLE IF EXISTS public.supplier_demand_access CASCADE;

CREATE TABLE public.supplier_demand_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_tier TEXT NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'premium', 'exclusive')),
  min_intent_visible INTEGER NOT NULL DEFAULT 0,
  max_alerts_per_day INTEGER NOT NULL DEFAULT 5,
  early_access_hours INTEGER NOT NULL DEFAULT 0,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id)
);

ALTER TABLE public.supplier_demand_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers view own access" ON public.supplier_demand_access
  FOR SELECT USING (supplier_id = auth.uid());

CREATE POLICY "Admins manage all access" ON public.supplier_demand_access
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Demand Lane Locks Table
CREATE TABLE public.demand_lane_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  min_intent_required INTEGER NOT NULL DEFAULT 7,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by UUID REFERENCES auth.users(id),
  max_suppliers INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, country)
);

ALTER TABLE public.demand_lane_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lane locks" ON public.demand_lane_locks
  FOR SELECT USING (true);

CREATE POLICY "Admins manage lane locks" ON public.demand_lane_locks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Lane Supplier Assignments Table
CREATE TABLE public.lane_supplier_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lane_id UUID NOT NULL REFERENCES public.demand_lane_locks(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority_rank INTEGER NOT NULL DEFAULT 1 CHECK (priority_rank BETWEEN 1 AND 3),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(lane_id, supplier_id),
  UNIQUE(lane_id, priority_rank)
);

ALTER TABLE public.lane_supplier_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers view own assignments" ON public.lane_supplier_assignments
  FOR SELECT USING (supplier_id = auth.uid());

CREATE POLICY "Admins manage all assignments" ON public.lane_supplier_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_lane_assignments_lane ON public.lane_supplier_assignments(lane_id) WHERE is_active = true;
CREATE INDEX idx_lane_assignments_supplier ON public.lane_supplier_assignments(supplier_id) WHERE is_active = true;

-- ============================================================
-- SQL FUNCTIONS
-- ============================================================

-- Function: Check and Create Demand Alerts
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
      COALESCE(SUM(dis.intent_score), 0)::INTEGER * 10 as total_intent,
      COUNT(*) as signal_count
    FROM demand_intelligence_signals dis
    WHERE dis.discovered_at >= NOW() - INTERVAL '7 days'
    GROUP BY dis.category, dis.country
    HAVING COALESCE(SUM(dis.intent_score), 0) * 10 >= 70
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
      MAX(COALESCE(dis.intent_score, 0))::INTEGER * 10 as max_intent
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

  UPDATE demand_alerts
  SET is_actioned = true
  WHERE expires_at < NOW()
  AND is_actioned = false;

  RETURN v_alerts_created;
END;
$$;

-- Function: Get Supplier Visible Demand (Monetisation Enforced)
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
      COALESCE(SUM(dis.intent_score), 0)::INTEGER * 10 as total_intent
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
      WHEN wl.total_intent < v_min_intent * 10 THEN true
      ELSE false
    END as can_access,
    CASE
      WHEN v_access_tier = 'exclusive' THEN 'Exclusive access'
      WHEN v_access_tier = 'premium' AND wl.lane_locked AND NOT wl.is_assigned THEN 'Lane locked - upgrade to exclusive'
      WHEN v_access_tier = 'premium' THEN 'Premium access'
      WHEN wl.total_intent >= v_min_intent * 10 THEN 'Upgrade to premium for high-intent demand'
      ELSE 'Free tier access'
    END as access_reason
  FROM with_locks wl
  ORDER BY wl.total_intent DESC;
END;
$$;

-- Function: Activate Lane from Signal
CREATE OR REPLACE FUNCTION public.activate_lane_from_signal(
  p_country TEXT,
  p_category TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lane_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  INSERT INTO demand_lane_locks (category, country, is_locked, locked_at, locked_by)
  VALUES (p_category, p_country, true, NOW(), auth.uid())
  ON CONFLICT (category, country) 
  DO UPDATE SET is_locked = true, locked_at = NOW(), locked_by = auth.uid(), updated_at = NOW()
  RETURNING id INTO v_lane_id;

  UPDATE demand_lanes 
  SET state = 'activated', updated_at = NOW()
  WHERE country = p_country AND category = p_category;

  RETURN json_build_object('success', true, 'lane_id', v_lane_id, 'message', 'Lane activated');
END;
$$;

-- Function: Get Demand Alerts for User
CREATE OR REPLACE FUNCTION public.get_demand_alerts(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  alert_type TEXT,
  category TEXT,
  country TEXT,
  intent_score INTEGER,
  rfq_count INTEGER,
  suggested_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN,
  is_actioned BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin') INTO v_is_admin;
  
  IF v_is_admin THEN
    RETURN QUERY
    SELECT da.id, da.alert_type, da.category, da.country,
      da.intent_score, da.rfq_count, da.suggested_action,
      da.created_at, da.expires_at, da.is_read, da.is_actioned
    FROM demand_alerts da
    WHERE da.expires_at > NOW()
    ORDER BY da.created_at DESC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT da.id, da.alert_type, da.category, da.country,
      da.intent_score, da.rfq_count, da.suggested_action,
      da.created_at, da.expires_at, da.is_read, da.is_actioned
    FROM demand_alerts da
    WHERE da.expires_at > NOW()
    AND EXISTS (
      SELECT 1 FROM supplier_categories sc
      WHERE sc.user_id = p_user_id
      AND sc.category_slug = da.category
    )
    ORDER BY da.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_and_create_demand_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_visible_demand(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_lane_from_signal(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_demand_alerts(UUID, INTEGER) TO authenticated;
