
-- ============================================================
-- ENTERPRISE INTELLIGENCE LAYER - ALL PHASES
-- ============================================================

-- PHASE 1: Contract Intelligence Layer
CREATE TABLE IF NOT EXISTS public.contract_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid REFERENCES public.demand_intelligence_signals(id),
  buyer_id uuid,
  supplier_id uuid,
  finance_partner text,
  credit_days integer,
  base_price numeric,
  platform_margin numeric,
  total_value numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contract_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contract_summaries"
ON public.contract_summaries FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ps_admin'))
);

CREATE POLICY "Buyers can view own contract_summaries"
ON public.contract_summaries FOR SELECT
USING (buyer_id = auth.uid());

CREATE POLICY "Suppliers can view own contract_summaries"
ON public.contract_summaries FOR SELECT
USING (supplier_id = auth.uid());

-- PHASE 3: Audit Trail Export RPC
CREATE OR REPLACE FUNCTION public.export_lane_audit(p_signal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  signal_row record;
  events_arr jsonb;
  bids_arr jsonb;
  contract_arr jsonb;
BEGIN
  -- Get signal data
  SELECT * INTO signal_row FROM demand_intelligence_signals WHERE id = p_signal_id;
  
  IF signal_row IS NULL THEN
    RETURN jsonb_build_object('error', 'Signal not found');
  END IF;

  -- Get all lane events
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'event_type', event_type,
      'from_state', from_state,
      'to_state', to_state,
      'actor', actor,
      'occurred_at', occurred_at,
      'metadata', metadata
    ) ORDER BY occurred_at
  ), '[]'::jsonb) INTO events_arr
  FROM lane_events WHERE signal_id = p_signal_id;

  -- Get anonymized bids
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'bid_id', b.id,
      'bid_amount', b.bid_amount,
      'buyer_visible_price', b.buyer_visible_price,
      'delivery_timeline_days', b.delivery_timeline_days,
      'status', b.status,
      'created_at', b.created_at,
      'platform_margin', b.platform_margin
    ) ORDER BY b.created_at
  ), '[]'::jsonb) INTO bids_arr
  FROM bids b
  JOIN requirements r ON r.id = b.requirement_id
  WHERE r.id = (SELECT converted_to_rfq_id FROM demand_intelligence_signals WHERE id = p_signal_id);

  -- Get contract summaries
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'finance_partner', finance_partner,
      'credit_days', credit_days,
      'base_price', base_price,
      'platform_margin', platform_margin,
      'total_value', total_value,
      'created_at', created_at
    )
  ), '[]'::jsonb) INTO contract_arr
  FROM contract_summaries WHERE signal_id = p_signal_id;

  result := jsonb_build_object(
    'audit_generated_at', now(),
    'signal', jsonb_build_object(
      'id', signal_row.id,
      'category', signal_row.category,
      'subcategory', signal_row.subcategory,
      'country', signal_row.country,
      'country_iso', signal_row.country_iso,
      'intent_score', signal_row.intent_score,
      'classification', signal_row.classification,
      'lane_state', signal_row.lane_state,
      'discovered_at', signal_row.discovered_at,
      'activated_at', signal_row.activated_at,
      'closed_at', signal_row.closed_at,
      'awarded_value', signal_row.awarded_value,
      'awarded_supplier_id', signal_row.awarded_supplier_id,
      'sla_status', signal_row.sla_status
    ),
    'timeline', events_arr,
    'bids', bids_arr,
    'contracts', contract_arr
  );

  RETURN result;
END;
$$;

-- PHASE 4: Supplier Risk Badges - add columns if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN kyc_verified boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'finance_approved') THEN
    ALTER TABLE public.profiles ADD COLUMN finance_approved boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'transaction_score') THEN
    ALTER TABLE public.profiles ADD COLUMN transaction_score numeric DEFAULT 0;
  END IF;
END $$;

-- PHASE 6: Governance Rules
CREATE TABLE IF NOT EXISTS public.governance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid,
  category text,
  max_credit_days integer,
  min_vendor_count integer DEFAULT 1,
  margin_cap numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.governance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage governance_rules"
ON public.governance_rules FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ps_admin'))
);

CREATE POLICY "Management can view governance_rules"
ON public.governance_rules FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('cfo', 'ceo', 'manager', 'buyer_cfo', 'buyer_ceo', 'buyer_manager'))
);

CREATE POLICY "Buyers can view own governance_rules"
ON public.governance_rules FOR SELECT
USING (buyer_id = auth.uid());

-- PHASE 2: Spend Analytics RPCs

-- Buyer Spend Summary
CREATE OR REPLACE FUNCTION public.get_buyer_spend_summary(p_buyer_id uuid, p_days integer DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_spend numeric;
  spend_by_cat jsonb;
  spend_by_country jsonb;
  avg_credit numeric;
  active_lanes bigint;
  closed_lanes bigint;
BEGIN
  -- Total spend from bids awarded to this buyer's requirements
  SELECT COALESCE(SUM(b.buyer_visible_price), 0) INTO total_spend
  FROM bids b
  JOIN requirements r ON r.id = b.requirement_id
  WHERE r.user_id = p_buyer_id
    AND b.status IN ('accepted', 'delivered', 'closed')
    AND b.created_at >= now() - (p_days || ' days')::interval;

  -- Spend by category
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('category', cat, 'spend', cat_spend)
  ), '[]'::jsonb) INTO spend_by_cat
  FROM (
    SELECT r.category as cat, SUM(b.buyer_visible_price) as cat_spend
    FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.user_id = p_buyer_id AND b.status IN ('accepted', 'delivered', 'closed')
      AND b.created_at >= now() - (p_days || ' days')::interval
    GROUP BY r.category ORDER BY cat_spend DESC
  ) sub;

  -- Spend by country
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('country', c, 'spend', c_spend)
  ), '[]'::jsonb) INTO spend_by_country
  FROM (
    SELECT r.delivery_country as c, SUM(b.buyer_visible_price) as c_spend
    FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.user_id = p_buyer_id AND b.status IN ('accepted', 'delivered', 'closed')
      AND b.created_at >= now() - (p_days || ' days')::interval
    GROUP BY r.delivery_country ORDER BY c_spend DESC
  ) sub;

  -- Average credit days
  SELECT COALESCE(AVG(b.delivery_timeline_days), 0) INTO avg_credit
  FROM bids b
  JOIN requirements r ON r.id = b.requirement_id
  WHERE r.user_id = p_buyer_id AND b.status IN ('accepted', 'delivered', 'closed');

  -- Lane counts from signals
  SELECT COUNT(*) FILTER (WHERE lane_state = 'activated'), COUNT(*) FILTER (WHERE lane_state = 'closed')
  INTO active_lanes, closed_lanes
  FROM demand_intelligence_signals
  WHERE awarded_supplier_id IS NOT NULL OR lane_state IN ('activated', 'closed');

  result := jsonb_build_object(
    'total_spend', total_spend,
    'spend_by_category', spend_by_cat,
    'spend_by_country', spend_by_country,
    'avg_credit_days', avg_credit,
    'active_lanes', active_lanes,
    'closed_lanes', closed_lanes,
    'period_days', p_days
  );

  RETURN result;
END;
$$;

-- Supplier Performance Summary
CREATE OR REPLACE FUNCTION public.get_supplier_performance(p_supplier_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_volume numeric;
  total_bids bigint;
  won_bids bigint;
  avg_deal numeric;
BEGIN
  SELECT COALESCE(SUM(bid_amount), 0), COUNT(*) INTO total_volume, won_bids
  FROM bids WHERE supplier_id = p_supplier_id AND status IN ('accepted', 'delivered', 'closed');

  SELECT COUNT(*) INTO total_bids FROM bids WHERE supplier_id = p_supplier_id;

  SELECT COALESCE(AVG(bid_amount), 0) INTO avg_deal
  FROM bids WHERE supplier_id = p_supplier_id AND status IN ('accepted', 'delivered', 'closed');

  result := jsonb_build_object(
    'total_volume_supplied', total_volume,
    'total_bids', total_bids,
    'won_bids', won_bids,
    'win_rate', CASE WHEN total_bids > 0 THEN ROUND((won_bids::numeric / total_bids) * 100, 1) ELSE 0 END,
    'avg_deal_size', avg_deal
  );

  RETURN result;
END;
$$;

-- Admin Platform Metrics
CREATE OR REPLACE FUNCTION public.get_admin_platform_metrics(p_days integer DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  margin_by_cat jsonb;
  margin_by_country jsonb;
  finance_util jsonb;
  risk_conc jsonb;
  total_margin numeric;
BEGIN
  -- Total platform margin
  SELECT COALESCE(SUM(platform_margin), 0) INTO total_margin
  FROM bids WHERE status IN ('accepted', 'delivered', 'closed')
    AND created_at >= now() - (p_days || ' days')::interval;

  -- Margin by category
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('category', cat, 'margin', m)
  ), '[]'::jsonb) INTO margin_by_cat
  FROM (
    SELECT r.category as cat, SUM(b.platform_margin) as m
    FROM bids b JOIN requirements r ON r.id = b.requirement_id
    WHERE b.status IN ('accepted', 'delivered', 'closed')
      AND b.created_at >= now() - (p_days || ' days')::interval
    GROUP BY r.category ORDER BY m DESC
  ) sub;

  -- Margin by country
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('country', c, 'margin', m)
  ), '[]'::jsonb) INTO margin_by_country
  FROM (
    SELECT r.delivery_country as c, SUM(b.platform_margin) as m
    FROM bids b JOIN requirements r ON r.id = b.requirement_id
    WHERE b.status IN ('accepted', 'delivered', 'closed')
      AND b.created_at >= now() - (p_days || ' days')::interval
    GROUP BY r.delivery_country ORDER BY m DESC
  ) sub;

  -- Risk concentration: top 3 buyers by revenue
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('buyer_id', buyer, 'revenue', rev, 'pct', pct)
  ), '[]'::jsonb) INTO risk_conc
  FROM (
    SELECT r.user_id as buyer, SUM(b.buyer_visible_price) as rev,
      ROUND(SUM(b.buyer_visible_price) * 100.0 / NULLIF((SELECT SUM(buyer_visible_price) FROM bids WHERE status IN ('accepted','delivered','closed')), 0), 1) as pct
    FROM bids b JOIN requirements r ON r.id = b.requirement_id
    WHERE b.status IN ('accepted', 'delivered', 'closed')
    GROUP BY r.user_id ORDER BY rev DESC LIMIT 3
  ) sub;

  result := jsonb_build_object(
    'total_platform_margin', total_margin,
    'margin_by_category', margin_by_cat,
    'margin_by_country', margin_by_country,
    'risk_concentration_top3', risk_conc,
    'period_days', p_days
  );

  RETURN result;
END;
$$;
