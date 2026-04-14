
-- 1. Add buyer_company_id to purchase_orders
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS buyer_company_id UUID REFERENCES public.buyer_companies(id);

-- Backfill from buyer_company_members
UPDATE public.purchase_orders po
SET buyer_company_id = bcm.company_id
FROM public.buyer_company_members bcm
WHERE po.created_by = bcm.user_id
  AND po.buyer_company_id IS NULL;

-- Index for fast company-scoped queries
CREATE INDEX IF NOT EXISTS idx_po_buyer_company_id ON public.purchase_orders(buyer_company_id);

-- 2. Single atomic RPC for Global Buyer Dashboard
CREATE OR REPLACE FUNCTION public.get_global_buyer_dashboard(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary JSONB;
  v_active_pos JSONB;
  v_overdue_pos JSONB;
  v_compliance JSONB;
  v_result JSONB;
BEGIN
  -- Verify caller belongs to this company
  IF NOT EXISTS (
    SELECT 1 FROM buyer_company_members
    WHERE user_id = auth.uid() AND company_id = p_company_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Summary KPIs
  SELECT jsonb_build_object(
    'total_pos', COUNT(*),
    'open_pos', COUNT(*) FILTER (WHERE status NOT IN ('delivered', 'cancelled', 'payment_confirmed')),
    'total_value', COALESCE(SUM(total_amount), 0),
    'open_payables', COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('delivered', 'cancelled', 'payment_confirmed')), 0),
    'overdue_count', COUNT(*) FILTER (WHERE COALESCE(payment_due_date, expected_delivery_date) < now() AND status NOT IN ('delivered', 'cancelled', 'payment_confirmed')),
    'overdue_value', COALESCE(SUM(total_amount) FILTER (WHERE COALESCE(payment_due_date, expected_delivery_date) < now() AND status NOT IN ('delivered', 'cancelled', 'payment_confirmed')), 0),
    'completed_count', COUNT(*) FILTER (WHERE status IN ('delivered', 'payment_confirmed')),
    'avg_po_value', COALESCE(AVG(total_amount), 0)
  ) INTO v_summary
  FROM purchase_orders
  WHERE buyer_company_id = p_company_id;

  -- Active POs (last 50, ordered by urgency)
  SELECT COALESCE(jsonb_agg(po_row ORDER BY urgency_rank), '[]'::jsonb)
  INTO v_active_pos
  FROM (
    SELECT jsonb_build_object(
      'id', po.id,
      'po_number', po.po_number,
      'status', po.status,
      'total_amount', po.total_amount,
      'currency', po.currency,
      'supplier_name', COALESCE(po.supplier_name, 'PS-' || LEFT(po.supplier_id::text, 6)),
      'created_at', po.created_at,
      'expected_delivery_date', po.expected_delivery_date,
      'payment_due_date', po.payment_due_date,
      'is_overdue', (COALESCE(po.payment_due_date, po.expected_delivery_date) < now() AND po.status NOT IN ('delivered', 'cancelled', 'payment_confirmed'))
    ) AS po_row,
    CASE
      WHEN COALESCE(po.payment_due_date, po.expected_delivery_date) < now() AND po.status NOT IN ('delivered', 'cancelled', 'payment_confirmed') THEN 0
      ELSE 1
    END AS urgency_rank
    FROM purchase_orders po
    WHERE po.buyer_company_id = p_company_id
      AND po.status NOT IN ('cancelled')
    ORDER BY urgency_rank, po.created_at DESC
    LIMIT 50
  ) sub;

  -- Overdue POs specifically
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', po.id,
    'po_number', po.po_number,
    'status', po.status,
    'total_amount', po.total_amount,
    'currency', po.currency,
    'supplier_name', COALESCE(po.supplier_name, 'PS-' || LEFT(po.supplier_id::text, 6)),
    'due_date', COALESCE(po.payment_due_date, po.expected_delivery_date),
    'days_overdue', EXTRACT(DAY FROM now() - COALESCE(po.payment_due_date, po.expected_delivery_date))::int
  ) ORDER BY COALESCE(po.payment_due_date, po.expected_delivery_date)), '[]'::jsonb)
  INTO v_overdue_pos
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) < now()
    AND po.status NOT IN ('delivered', 'cancelled', 'payment_confirmed');

  -- Compliance summary
  SELECT jsonb_build_object(
    'missing_incoterms', COUNT(*) FILTER (WHERE incoterms IS NULL AND po.currency != 'INR'),
    'missing_payment_terms', COUNT(*) FILTER (WHERE payment_terms IS NULL),
    'total_active', COUNT(*)
  ) INTO v_compliance
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status NOT IN ('delivered', 'cancelled', 'payment_confirmed');

  v_result := jsonb_build_object(
    'summary', v_summary,
    'active_pos', v_active_pos,
    'overdue_pos', v_overdue_pos,
    'compliance', v_compliance
  );

  RETURN v_result;
END;
$$;

-- 3. Enhance CFO decision engine with feedback learning loop
CREATE OR REPLACE FUNCTION public.get_feedback_adjusted_confidence(
  p_company_id UUID,
  p_action_type TEXT,
  p_base_confidence NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_score NUMERIC;
  v_sample_count INT;
  v_multiplier NUMERIC := 1.0;
BEGIN
  SELECT AVG(effectiveness_score), COUNT(*)
  INTO v_avg_score, v_sample_count
  FROM cfo_action_feedback
  WHERE company_id = p_company_id
    AND action_type = p_action_type
    AND effectiveness_score IS NOT NULL;

  IF v_sample_count >= 3 THEN
    -- Scale: avg 5 = 1.2x boost, avg 1 = 0.6x penalty
    v_multiplier := 0.6 + (COALESCE(v_avg_score, 3.0) / 5.0) * 0.6;
  END IF;

  RETURN LEAST(p_base_confidence * v_multiplier, 1.0);
END;
$$;
