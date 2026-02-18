
/* =========================================================
   1️⃣ ADD AI COLUMNS
========================================================= */

ALTER TABLE public.demand_intelligence_signals
ADD COLUMN IF NOT EXISTS predicted_price numeric,
ADD COLUMN IF NOT EXISTS price_deviation_percent numeric;

ALTER TABLE public.contract_summaries
ADD COLUMN IF NOT EXISTS margin_percent numeric,
ADD COLUMN IF NOT EXISTS supplier_ai_score numeric,
ADD COLUMN IF NOT EXISTS country text;

/* =========================================================
   2️⃣ INTENT SCORING ENGINE
========================================================= */

CREATE OR REPLACE FUNCTION public.calculate_intent_score(
    p_signal_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_bid_count int;
    v_recent_activity int;
    v_score numeric;
BEGIN
    SELECT COUNT(*) INTO v_bid_count
    FROM public.contract_summaries
    WHERE signal_id = p_signal_id;

    SELECT COUNT(*) INTO v_recent_activity
    FROM public.audit_ledger
    WHERE entity_id = p_signal_id::text
      AND performed_at >= now() - interval '7 days';

    v_score :=
        (COALESCE(v_bid_count,0) * 15) +
        (COALESCE(v_recent_activity,0) * 10);

    UPDATE public.demand_intelligence_signals
    SET intent_score = LEAST(v_score,100),
        confidence_score = LEAST(v_score / 1.5,100)
    WHERE id = p_signal_id;
END;
$$;

/* =========================================================
   3️⃣ PREDICTIVE PRICE ENGINE
========================================================= */

CREATE OR REPLACE FUNCTION public.calculate_predicted_price(
    p_category text,
    p_country text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_avg_price numeric;
BEGIN
    SELECT AVG(base_price)
    INTO v_avg_price
    FROM public.contract_summaries
    WHERE category = p_category
      AND country = p_country
      AND approval_status = 'approved';

    RETURN COALESCE(v_avg_price, 0);
END;
$$;

/* =========================================================
   4️⃣ SUPPLIER AI RANKING ENGINE
========================================================= */

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
        COUNT(*) FILTER (WHERE approval_status='approved')::numeric
        / NULLIF(COUNT(*),0),
        AVG(margin_percent),
        SUM(total_value)
    INTO v_win_rate, v_avg_margin, v_total_volume
    FROM public.contract_summaries
    WHERE supplier_id = p_supplier_id::text;

    v_score :=
        (COALESCE(v_win_rate,0) * 40) +
        (COALESCE(v_avg_margin,0) * 2) +
        (COALESCE(v_total_volume,0) / 1000000);

    UPDATE public.contract_summaries
    SET supplier_ai_score = v_score
    WHERE supplier_id = p_supplier_id::text;

    RETURN v_score;
END;
$$;

/* =========================================================
   5️⃣ AUTO TRAIN ON CONTRACT APPROVAL
========================================================= */

CREATE OR REPLACE FUNCTION public.ai_auto_train_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.approval_status = 'approved' THEN
        NEW.margin_percent :=
            (NEW.platform_margin / NULLIF(NEW.total_value, 0)) * 100;

        PERFORM public.calculate_supplier_score(NEW.supplier_id::uuid);
        PERFORM public.calculate_intent_score(NEW.signal_id::uuid);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_training_trigger ON public.contract_summaries;

CREATE TRIGGER ai_training_trigger
BEFORE UPDATE ON public.contract_summaries
FOR EACH ROW
EXECUTE FUNCTION public.ai_auto_train_trigger();

/* =========================================================
   6️⃣ INDEXING FOR AI SPEED
========================================================= */

CREATE INDEX IF NOT EXISTS idx_contract_category
ON public.contract_summaries(category);

CREATE INDEX IF NOT EXISTS idx_contract_country
ON public.contract_summaries(country);

CREATE INDEX IF NOT EXISTS idx_contract_supplier_ai
ON public.contract_summaries(supplier_ai_score);

CREATE INDEX IF NOT EXISTS idx_signal_intent
ON public.demand_intelligence_signals(intent_score);
