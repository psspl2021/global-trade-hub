
-- Create normalized supplier AI profiles table
CREATE TABLE IF NOT EXISTS public.supplier_ai_profiles (
    supplier_id uuid PRIMARY KEY,
    win_rate numeric,
    avg_margin numeric,
    total_volume numeric,
    supplier_ai_score numeric,
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_ai_profiles ENABLE ROW LEVEL SECURITY;

-- Admin read access
CREATE POLICY "Admins can view supplier profiles"
ON public.supplier_ai_profiles FOR SELECT
USING (true);

-- Only functions (SECURITY DEFINER) write to this table, no direct user writes needed

-- Update the scoring function to use the new table
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

    -- Upsert into normalized profile table
    INSERT INTO public.supplier_ai_profiles (supplier_id, win_rate, avg_margin, total_volume, supplier_ai_score, updated_at)
    VALUES (p_supplier_id, v_win_rate, v_avg_margin, v_total_volume, v_score, now())
    ON CONFLICT (supplier_id) DO UPDATE SET
        win_rate = EXCLUDED.win_rate,
        avg_margin = EXCLUDED.avg_margin,
        total_volume = EXCLUDED.total_volume,
        supplier_ai_score = EXCLUDED.supplier_ai_score,
        updated_at = now();

    RETURN v_score;
END;
$$;
