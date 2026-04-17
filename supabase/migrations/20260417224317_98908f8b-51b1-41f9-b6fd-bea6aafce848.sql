-- Restore the full data contract for get_company_intelligence_v2
-- Preserves: role resolution, summary keys consumed by the UI (total_payable, payable_7d, overdue, po_count),
-- and integrates new lifecycle + purchaser attribution fields.

CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_base_currency text := 'INR';
  v_summary jsonb;
  v_insights jsonb;
  v_pos jsonb;
  v_stage_counts jsonb;
  v_top_purchasers jsonb;
  v_total_pos int := 0;
  v_total_value numeric := 0;
  v_total_payable numeric := 0;
  v_payable_7d numeric := 0;
  v_overdue_count int := 0;
  v_overdue_value numeric := 0;
  v_override_count int := 0;
  v_flagged_count int := 0;
  v_pending_ack_count int := 0;
  v_paid_count int := 0;
  v_finalized_count int := 0;
BEGIN
  -- 1) Authoritative role + company resolution
  SELECT role, array_agg(company_id)
  INTO v_role, v_company_ids
  FROM public.user_company_access
  WHERE user_id = p_user_id
  GROUP BY role
  LIMIT 1;

  IF v_role IS NULL OR v_company_ids IS NULL THEN
    RETURN jsonb_build_object(
      'role', NULL,
      'error', 'NO_ROLE',
      'summary', jsonb_build_object('po_count', 0, 'total_payable', 0, 'overdue', 0, 'payable_7d', 0)
    );
  END IF;

  -- Base currency from first company
  SELECT COALESCE(bc.base_currency, 'INR') INTO v_base_currency
  FROM public.buyer_companies bc
  WHERE bc.id = v_company_ids[1]
  LIMIT 1;

  -- 2) Aggregate scoped POs
  WITH base AS (
    SELECT
      po.id,
      po.po_number,
      po.po_value_base_currency,
      po.payment_due_date,
      po.payment_status,
      po.created_at,
      po.created_by,
      po.ceo_override,
      COALESCE(pr.company_name, pr.contact_person, 'User ' || LEFT(po.created_by::text,6)) AS purchaser_name,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND po.payment_status <> 'paid') AS is_overdue,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND po.payment_status <> 'paid') AS due_7d,
      (po.payment_status <> 'paid') AS is_payable,
      public.get_po_lifecycle_stage(
        po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
      ) AS lifecycle_stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
    LEFT JOIN public.profiles pr ON pr.id = po.created_by
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', id,
      'po_number', po_number,
      'amount', po_value_base_currency,
      'due_date', payment_due_date,
      'stage', lifecycle_stage,
      'purchaser', purchaser_name,
      'purchaser_id', created_by,
      'is_overdue', is_overdue,
      'ceo_override', ceo_override
    ) ORDER BY created_at DESC), '[]'::jsonb),
    COUNT(*),
    COALESCE(SUM(po_value_base_currency), 0),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE is_payable), 0),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE due_7d), 0),
    COUNT(*) FILTER (WHERE is_overdue),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE is_overdue), 0),
    COUNT(*) FILTER (WHERE ceo_override = true),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'FLAGGED'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'PENDING_ACK'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'PAID'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'FINALIZED')
  INTO v_pos, v_total_pos, v_total_value, v_total_payable, v_payable_7d,
       v_overdue_count, v_overdue_value, v_override_count, v_flagged_count,
       v_pending_ack_count, v_paid_count, v_finalized_count
  FROM base;

  -- Stage counts
  WITH base AS (
    SELECT public.get_po_lifecycle_stage(
      po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
    ) AS stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  )
  SELECT COALESCE(jsonb_object_agg(stage, cnt), '{}'::jsonb)
  INTO v_stage_counts
  FROM (SELECT stage, COUNT(*) AS cnt FROM base GROUP BY stage) s;

  -- Top purchasers
  WITH base AS (
    SELECT
      po.created_by,
      COALESCE(pr.company_name, pr.contact_person, 'User ' || LEFT(po.created_by::text,6)) AS purchaser_name,
      po.po_value_base_currency,
      po.ceo_override,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND po.payment_status <> 'paid') AS is_overdue,
      public.get_po_lifecycle_stage(
        po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
      ) AS stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
    LEFT JOIN public.profiles pr ON pr.id = po.created_by
    WHERE po.created_by IS NOT NULL
  )
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_top_purchasers
  FROM (
    SELECT
      created_by AS purchaser_id,
      purchaser_name AS purchaser,
      COUNT(*)::int AS total_pos,
      COALESCE(SUM(po_value_base_currency), 0) AS total_value,
      COUNT(*) FILTER (WHERE is_overdue)::int AS overdue_count,
      COUNT(*) FILTER (WHERE stage IN ('PENDING_ACK','PENDING_APPROVAL','FLAGGED','CEO_OVERRIDE'))::int AS stuck_count,
      COUNT(*) FILTER (WHERE ceo_override = true)::int AS override_count
    FROM base
    GROUP BY created_by, purchaser_name
    ORDER BY COALESCE(SUM(po_value_base_currency), 0) DESC
    LIMIT 10
  ) t;

  -- 3) Build summary with BOTH legacy keys (UI contract) AND new keys
  v_summary := jsonb_build_object(
    -- Legacy/UI-contract keys (do not remove)
    'po_count', v_total_pos,
    'total_payable', v_total_payable,
    'overdue', v_overdue_value,
    'payable_7d', v_payable_7d,
    -- New keys
    'total_pos', v_total_pos,
    'total_value', v_total_value,
    'overdue_count', v_overdue_count,
    'overdue_value', v_overdue_value,
    'override_count', v_override_count,
    'flagged_count', v_flagged_count,
    'pending_ack_count', v_pending_ack_count,
    'paid_count', v_paid_count,
    'finalized_count', v_finalized_count,
    'base_currency', v_base_currency,
    'stage_counts', v_stage_counts
  );

  v_insights := jsonb_build_object(
    'top_purchasers', v_top_purchasers,
    'stage_counts', v_stage_counts,
    'note', 'Lifecycle resolved via public.get_po_lifecycle_stage (single source of truth)'
  );

  RETURN jsonb_build_object(
    'role', v_role,
    'company_ids', to_jsonb(v_company_ids),
    'base_currency', v_base_currency,
    'summary', v_summary,
    'insights', v_insights,
    'pos', v_pos,
    'actions', '[]'::jsonb,
    'upcoming_payments', '[]'::jsonb,
    'empty', (v_total_pos = 0)
  );
END;
$$;