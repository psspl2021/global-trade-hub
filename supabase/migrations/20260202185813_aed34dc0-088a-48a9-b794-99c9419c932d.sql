-- ============================================================
-- PHASE-3: DEMAND ALERTS + SUPPLIER MONETISATION SCHEMA (FIXED)
-- ============================================================

-- 1. DEMAND ALERTS TABLE
-- Stores AI-triggered alerts when demand thresholds are met
CREATE TABLE IF NOT EXISTS public.demand_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('intent_threshold', 'rfq_spike', 'cross_country_spike')),
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  intent_score INT NOT NULL DEFAULT 0,
  rfq_count INT NOT NULL DEFAULT 0,
  time_window_hours INT NOT NULL DEFAULT 72,
  suggested_action TEXT NOT NULL,
  countries_affected TEXT[] DEFAULT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_actioned BOOLEAN NOT NULL DEFAULT false,
  actioned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actioned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS
ALTER TABLE public.demand_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage demand alerts"
  ON public.demand_alerts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Suppliers can view alerts for their categories (using supplier_categories from profiles)
CREATE POLICY "Suppliers can view category-matched alerts"
  ON public.demand_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.business_type = 'supplier'
        AND category = ANY(p.supplier_categories)
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_demand_alerts_category ON public.demand_alerts(category);
CREATE INDEX IF NOT EXISTS idx_demand_alerts_country ON public.demand_alerts(country);
CREATE INDEX IF NOT EXISTS idx_demand_alerts_created ON public.demand_alerts(created_at DESC);

-- 2. SUPPLIER DEMAND ACCESS TABLE
-- Controls what demand data suppliers can access based on subscription
CREATE TABLE IF NOT EXISTS public.supplier_demand_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_tier TEXT NOT NULL CHECK (access_tier IN ('free', 'premium', 'exclusive')) DEFAULT 'free',
  min_intent_visible INT NOT NULL DEFAULT 0,
  max_rfq_alerts_per_day INT NOT NULL DEFAULT 3,
  early_access_hours INT NOT NULL DEFAULT 0,
  categories_locked TEXT[] DEFAULT NULL,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id)
);

-- Enable RLS
ALTER TABLE public.supplier_demand_access ENABLE ROW LEVEL SECURITY;

-- Suppliers can view their own access
CREATE POLICY "Suppliers can view own access"
  ON public.supplier_demand_access
  FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

-- Admins can manage all access
CREATE POLICY "Admins can manage access"
  ON public.supplier_demand_access
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_supplier_demand_access_supplier ON public.supplier_demand_access(supplier_id);

-- 3. DEMAND LANE LOCKS TABLE
-- Locks high-intent lanes to top suppliers
CREATE TABLE IF NOT EXISTS public.demand_lane_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  intent_threshold INT NOT NULL DEFAULT 7,
  max_suppliers INT NOT NULL DEFAULT 3,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, country)
);

-- Enable RLS
ALTER TABLE public.demand_lane_locks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage lane locks
CREATE POLICY "Admins can manage lane locks"
  ON public.demand_lane_locks
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active locks (for display purposes)
CREATE POLICY "Anyone can view active lane locks"
  ON public.demand_lane_locks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_demand_lane_locks_category ON public.demand_lane_locks(category, country);

-- 4. LANE SUPPLIER ASSIGNMENTS
-- Which suppliers are assigned to locked lanes
CREATE TABLE IF NOT EXISTS public.lane_supplier_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lane_lock_id UUID NOT NULL REFERENCES public.demand_lane_locks(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority_rank INT NOT NULL DEFAULT 1,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(lane_lock_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.lane_supplier_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage assignments
CREATE POLICY "Admins can manage lane assignments"
  ON public.lane_supplier_assignments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Suppliers can view their own assignments
CREATE POLICY "Suppliers can view own assignments"
  ON public.lane_supplier_assignments
  FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

-- 5. FUNCTION: Check & Create Demand Alerts
CREATE OR REPLACE FUNCTION public.check_and_create_demand_alerts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alerts_created INT := 0;
  rec RECORD;
BEGIN
  -- Delete expired alerts
  DELETE FROM demand_alerts WHERE expires_at < now();

  -- Check for intent >= 7 (High Intent Alert)
  FOR rec IN
    SELECT 
      category,
      country,
      CEIL(SUM(intent_score * 10))::INT AS intent,
      COUNT(*) FILTER (WHERE classification = 'buy' OR lane_state = 'rfq_submitted') AS rfqs
    FROM demand_intelligence_signals
    WHERE discovered_at >= NOW() - INTERVAL '7 days'
    GROUP BY category, country
    HAVING CEIL(SUM(intent_score * 10)) >= 7
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM demand_alerts 
      WHERE category = rec.category 
        AND country = rec.country 
        AND alert_type = 'intent_threshold'
        AND created_at >= NOW() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO demand_alerts (
        alert_type, category, country, intent_score, rfq_count, 
        suggested_action, time_window_hours
      ) VALUES (
        'intent_threshold', rec.category, rec.country, rec.intent, rec.rfqs,
        CASE 
          WHEN rec.intent >= 10 THEN 'Lock Category Exclusivity'
          WHEN rec.rfqs >= 3 THEN 'Invite Premium Suppliers'
          ELSE 'Activate Supplier Lane'
        END,
        168
      );
      alerts_created := alerts_created + 1;
    END IF;
  END LOOP;

  -- Check for RFQ spike (>= 3 RFQs in 72 hours)
  FOR rec IN
    SELECT 
      category,
      country,
      COUNT(*) AS rfq_count
    FROM demand_intelligence_signals
    WHERE discovered_at >= NOW() - INTERVAL '72 hours'
      AND (classification = 'buy' OR lane_state = 'rfq_submitted')
    GROUP BY category, country
    HAVING COUNT(*) >= 3
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM demand_alerts 
      WHERE category = rec.category 
        AND country = rec.country 
        AND alert_type = 'rfq_spike'
        AND created_at >= NOW() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO demand_alerts (
        alert_type, category, country, intent_score, rfq_count, 
        suggested_action, time_window_hours
      ) VALUES (
        'rfq_spike', rec.category, rec.country, 0, rec.rfq_count,
        'Invite Premium Suppliers',
        72
      );
      alerts_created := alerts_created + 1;
    END IF;
  END LOOP;

  -- Check for cross-country spike (same category in >= 2 countries)
  FOR rec IN
    SELECT 
      category,
      array_agg(DISTINCT country) AS countries,
      COUNT(DISTINCT country) AS country_count,
      CEIL(SUM(intent_score * 10))::INT AS total_intent
    FROM demand_intelligence_signals
    WHERE discovered_at >= NOW() - INTERVAL '7 days'
    GROUP BY category
    HAVING COUNT(DISTINCT country) >= 2
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM demand_alerts 
      WHERE category = rec.category 
        AND alert_type = 'cross_country_spike'
        AND created_at >= NOW() - INTERVAL '48 hours'
    ) THEN
      INSERT INTO demand_alerts (
        alert_type, category, country, intent_score, rfq_count, 
        suggested_action, time_window_hours, countries_affected
      ) VALUES (
        'cross_country_spike', rec.category, 'GLOBAL', rec.total_intent, 0,
        'Lock Category Exclusivity',
        168,
        rec.countries
      );
      alerts_created := alerts_created + 1;
    END IF;
  END LOOP;

  RETURN alerts_created;
END;
$$;

-- 6. FUNCTION: Get Supplier Visible Demand (with monetisation gates)
CREATE OR REPLACE FUNCTION public.get_supplier_visible_demand(
  p_supplier_id UUID
)
RETURNS TABLE (
  category TEXT,
  country TEXT,
  intent INT,
  rfqs INT,
  state TEXT,
  is_locked BOOLEAN,
  available_slots INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH supplier_access AS (
    SELECT 
      COALESCE(sda.min_intent_visible, 0) AS min_intent,
      COALESCE(sda.access_tier, 'free') AS tier,
      COALESCE(sda.categories_locked, ARRAY[]::TEXT[]) AS locked_cats
    FROM supplier_demand_access sda
    WHERE sda.supplier_id = p_supplier_id
  ),
  default_access AS (
    SELECT 0 AS min_intent, 'free' AS tier, ARRAY[]::TEXT[] AS locked_cats
  ),
  final_access AS (
    SELECT * FROM supplier_access
    UNION ALL
    SELECT * FROM default_access
    LIMIT 1
  ),
  demand_data AS (
    SELECT
      d.category,
      d.country,
      CEIL(SUM(d.intent_score * 10))::INT AS intent,
      COUNT(*) FILTER (
        WHERE d.classification = 'buy' OR d.lane_state = 'rfq_submitted'
      ) AS rfqs,
      CASE
        WHEN CEIL(SUM(d.intent_score * 10)) >= 7 THEN 'Active'
        WHEN CEIL(SUM(d.intent_score * 10)) >= 4 THEN 'Confirmed'
        ELSE 'Detected'
      END AS state
    FROM demand_intelligence_signals d
    WHERE d.discovered_at >= NOW() - INTERVAL '7 days'
    GROUP BY d.category, d.country
  )
  SELECT 
    dd.category,
    dd.country,
    CASE 
      WHEN fa.tier = 'free' AND dd.intent >= 4 THEN 0
      ELSE dd.intent
    END AS intent,
    CASE 
      WHEN fa.tier = 'free' THEN 0
      ELSE dd.rfqs
    END AS rfqs,
    CASE 
      WHEN fa.tier = 'free' AND dd.intent >= 4 THEN 'Hidden'
      ELSE dd.state
    END AS state,
    EXISTS (
      SELECT 1 FROM demand_lane_locks dll 
      WHERE dll.category = dd.category 
        AND dll.country = dd.country 
        AND dll.is_active = true
    ) AS is_locked,
    COALESCE(
      (SELECT dll.max_suppliers - COUNT(lsa.id)
       FROM demand_lane_locks dll
       LEFT JOIN lane_supplier_assignments lsa ON lsa.lane_lock_id = dll.id AND lsa.is_active = true
       WHERE dll.category = dd.category AND dll.country = dd.country AND dll.is_active = true
       GROUP BY dll.max_suppliers
       LIMIT 1), 
      3
    )::INT AS available_slots
  FROM demand_data dd
  CROSS JOIN final_access fa
  WHERE dd.intent >= fa.min_intent OR fa.tier != 'free'
  ORDER BY dd.intent DESC;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_create_demand_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_visible_demand TO authenticated;