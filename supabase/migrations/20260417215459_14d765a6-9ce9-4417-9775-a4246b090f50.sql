CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary jsonb;
  v_insights jsonb;
  v_rows jsonb;
  v_stage_counts jsonb;
  v_purchaser_stats jsonb;
BEGIN
  WITH base AS (
    SELECT
      po.id,
      po.po_number,
      po.po_value_base_currency,
      po.payment_due_date,
      po.payment_status,
      po.approval_status,
      po.ceo_override,
      po.manager_ack_at,
      po.created_at,
      po.created_by,
      COALESCE(NULLIF(pr.contact_person,''), NULLIF(pr.company_name,''),
               'User ' || LEFT(po.created_by::text,6)) AS purchaser_name,
      CASE
        WHEN po.payment_status = 'paid' THEN 'PAID'
        WHEN po.manager_ack_at IS NOT NULL THEN 'FINALIZED'
        WHEN po.ceo_override = true AND po.approval_status = 'pending_ack' THEN 'PENDING_ACK'
        WHEN po.ceo_override = true THEN 'CEO_OVERRIDE'
        WHEN po.approval_status = 'flagged_for_review' THEN 'FLAGGED'
        WHEN po.approval_status = 'pending_ack' THEN 'PENDING_APPROVAL'
        WHEN po.approval_status = 'force_closed' THEN 'FORCE_CLOSED'
        ELSE 'PO_CREATED'
      END AS lifecycle_stage,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue
    FROM public.get_scoped_purchase_orders(p_user_id) po
    LEFT JOIN public.profiles pr ON pr.id = po.created_by
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', id,
      'po_number', po_number,
      'amount', po_value_base_currency,
      'due_date', payment_due_date,
      'created_at', created_at,
      'stage', lifecycle_stage,
      'purchaser_id', created_by,
      'purchaser', purchaser_name,
      'is_overdue', is_overdue,
      'ceo_override', ceo_override
    ) ORDER BY created_at DESC), '[]'::jsonb)
  INTO v_rows
  FROM base;

  -- Stage distribution
  SELECT COALESCE(jsonb_object_agg(stage, cnt), '{}'::jsonb)
  INTO v_stage_counts
  FROM (
    SELECT (elem->>'stage') AS stage, COUNT(*) AS cnt
    FROM jsonb_array_elements(v_rows) elem
    GROUP BY 1
  ) s;

  -- Purchaser performance
  SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]'::jsonb)
  INTO v_purchaser_stats
  FROM (
    SELECT
      (elem->>'purchaser_id') AS purchaser_id,
      (elem->>'purchaser') AS purchaser,
      COUNT(*) AS total_pos,
      SUM(COALESCE((elem->>'amount')::numeric,0)) AS total_value,
      SUM(CASE WHEN (elem->>'is_overdue')::boolean THEN 1 ELSE 0 END) AS overdue_count,
      SUM(CASE WHEN (elem->>'stage') IN ('PENDING_ACK','PENDING_APPROVAL','FLAGGED') THEN 1 ELSE 0 END) AS stuck_count,
      SUM(CASE WHEN (elem->>'ceo_override')::boolean THEN 1 ELSE 0 END) AS override_count
    FROM jsonb_array_elements(v_rows) elem
    GROUP BY 1, 2
    ORDER BY stuck_count DESC, overdue_count DESC
    LIMIT 20
  ) p;

  v_summary := jsonb_build_object(
    'total_pos', jsonb_array_length(v_rows),
    'stage_counts', v_stage_counts
  );

  v_insights := jsonb_build_object(
    'top_purchasers', v_purchaser_stats,
    'note', 'Lifecycle + purchaser attribution enabled'
  );

  RETURN jsonb_build_object(
    'summary', v_summary,
    'insights', v_insights,
    'pos', v_rows,
    'generated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_intelligence_v2(uuid) TO authenticated;