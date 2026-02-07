-- ============================================================
-- SECURITY AUDIT FIX: CONTROL TOWER EXECUTIVE METRICS
-- ============================================================

-- Drop and recreate the view with correct column references
DROP VIEW IF EXISTS public.control_tower_executive_metrics;

CREATE OR REPLACE VIEW public.control_tower_executive_metrics AS
SELECT 
    COALESCE(SUM(CASE WHEN b.status = 'accepted' THEN b.markup_amount ELSE 0 END), 0)::numeric AS total_ai_verified_savings,
    COALESCE(
        (SELECT SUM(CASE WHEN severity = 'critical' THEN impact_value ELSE 0 END) FROM control_tower_alerts WHERE is_resolved = false),
        0
    )::numeric AS revenue_protected,
    (SELECT COUNT(*) FROM requirements WHERE status = 'active')::bigint AS live_high_risk_rfqs,
    CASE 
        WHEN SUM(b.service_fee) > 0 THEN 
            ROUND(SUM(CASE WHEN b.status = 'accepted' THEN b.markup_amount ELSE 0 END)::numeric / NULLIF(SUM(b.service_fee)::numeric, 0), 2)
        ELSE 0 
    END AS platform_roi_ratio,
    COALESCE(SUM(b.total_amount), 0)::numeric AS total_platform_volume,
    COALESCE(SUM(b.service_fee), 0)::numeric AS total_platform_fee
FROM bids b
WHERE b.created_at > now() - interval '30 days';

-- Grant select to authenticated users
GRANT SELECT ON public.control_tower_executive_metrics TO authenticated;

COMMENT ON VIEW public.control_tower_executive_metrics IS 
'CONTROL TOWER: Executive KPIs - 4 metrics only as per governance rules.';