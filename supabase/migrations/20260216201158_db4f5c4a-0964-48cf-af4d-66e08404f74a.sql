
-- ================================
-- 1️⃣ CLEAN OLD FUNCTIONS
-- ================================
DROP FUNCTION IF EXISTS public.get_buyer_spend_summary(uuid, integer);
DROP FUNCTION IF EXISTS public.get_supplier_performance(uuid);
DROP FUNCTION IF EXISTS public.get_admin_platform_metrics();
DROP FUNCTION IF EXISTS public.export_lane_audit(uuid);

-- ================================
-- 2️⃣ BUYER SPEND SUMMARY
-- ================================
CREATE OR REPLACE FUNCTION public.get_buyer_spend_summary(
    p_buyer_id uuid,
    p_days integer DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_spend', COALESCE(SUM(total_value), 0),
        'avg_credit_days', COALESCE(AVG(credit_days), 0),
        'contracts', COUNT(*)
    )
    INTO result
    FROM public.contract_summaries
    WHERE buyer_id = p_buyer_id
    AND created_at >= NOW() - (p_days || ' days')::interval;
    RETURN COALESCE(result, '{}'::json);
END;
$$;

-- ================================
-- 3️⃣ SUPPLIER PERFORMANCE
-- ================================
CREATE OR REPLACE FUNCTION public.get_supplier_performance(
    p_supplier_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_contracts', COUNT(*),
        'total_revenue', COALESCE(SUM(total_value), 0),
        'avg_margin', COALESCE(AVG(platform_margin), 0)
    )
    INTO result
    FROM public.contract_summaries
    WHERE supplier_id = p_supplier_id;
    RETURN COALESCE(result, '{}'::json);
END;
$$;

-- ================================
-- 4️⃣ ADMIN METRICS FUNCTION
-- ================================
CREATE OR REPLACE FUNCTION public.get_admin_platform_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_contracts', COUNT(*),
        'total_volume', COALESCE(SUM(total_value), 0)
    )
    INTO result
    FROM public.contract_summaries;
    RETURN COALESCE(result, '{}'::json);
END;
$$;

-- ================================
-- 5️⃣ LANE AUDIT EXPORT
-- ================================
CREATE OR REPLACE FUNCTION public.export_lane_audit(
    p_signal_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(cs)
    INTO result
    FROM public.contract_summaries cs
    WHERE cs.signal_id = p_signal_id;
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ================================
-- 6️⃣ ENABLE RLS
-- ================================
ALTER TABLE public.contract_summaries ENABLE ROW LEVEL SECURITY;

-- ================================
-- 7️⃣ RLS POLICIES
-- ================================
DROP POLICY IF EXISTS admin_full_access_contracts ON public.contract_summaries;

CREATE POLICY admin_full_access_contracts
ON public.contract_summaries
FOR ALL
USING (true)
WITH CHECK (true);
