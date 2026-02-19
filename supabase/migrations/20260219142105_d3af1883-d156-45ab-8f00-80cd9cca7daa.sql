CREATE OR REPLACE FUNCTION public.calculate_supplier_score(
    p_supplier_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_win_rate numeric;
    v_avg_margin numeric;
    v_total_volume numeric;
    v_score numeric;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE approval_status = 'approved')::numeric
            / NULLIF(COUNT(*),0),
        AVG(margin_percent),
        SUM(total_value)
    INTO v_win_rate, v_avg_margin, v_total_volume
    FROM public.contract_summaries
    WHERE supplier_id = p_supplier_id;

    v_score :=
        (COALESCE(v_win_rate,0) * 40) +
        (COALESCE(v_avg_margin,0) * 2) +
        (COALESCE(v_total_volume,0) / 1000000);

    UPDATE public.contract_summaries
    SET supplier_ai_score = v_score
    WHERE supplier_id = p_supplier_id;

    RETURN v_score;
END;
$$;