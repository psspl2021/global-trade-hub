
-- =========================================================
-- 1) NULL-safe lifecycle resolver
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_po_lifecycle_stage(
  p_payment_status text,
  p_manager_ack_at timestamptz,
  p_approval_status text,
  p_ceo_override boolean
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN COALESCE(p_payment_status,'') = 'paid' THEN 'PAID'
    WHEN p_manager_ack_at IS NOT NULL THEN 'FINALIZED'
    WHEN COALESCE(p_approval_status,'') = 'force_closed' THEN 'FORCE_CLOSED'
    WHEN COALESCE(p_approval_status,'') = 'flagged_for_review' THEN 'FLAGGED'
    WHEN COALESCE(p_approval_status,'') = 'pending_ack' THEN 'PENDING_ACK'
    WHEN COALESCE(p_ceo_override, false) = true THEN 'CEO_OVERRIDE'
    WHEN COALESCE(p_approval_status,'') = 'pending_approval' THEN 'PENDING_APPROVAL'
    ELSE 'PO_CREATED'
  END;
$$;

-- =========================================================
-- 2) Deterministic role/company resolution in v2
--    (CEO row preferred, then most recent grant)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  -- Deterministic: pick highest-authority role first, then newest
  WITH ranked AS (
    SELECT
      uca.role,
      uca.company_id,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE LOWER(uca.role)
            WHEN 'ceo' THEN 1
            WHEN 'cfo' THEN 2
            WHEN 'director' THEN 3
            WHEN 'manager' THEN 4
            WHEN 'purchaser' THEN 5
            WHEN 'hr' THEN 6
            ELSE 9
          END,
          uca.created_at DESC NULLS LAST
      ) AS rn
    FROM public.user_company_access uca
    WHERE uca.user_id = p_user_id
  ),
  picked AS (
    SELECT role FROM ranked WHERE rn = 1
  )
  SELECT p.role, ARRAY_AGG(r.company_id)
  INTO v_role, v_company_ids
  FROM picked p
  JOIN public.user_company_access r
    ON r.user_id = p_user_id AND r.role = p.role
  GROUP BY p.role;

  IF v_role IS NULL OR v_company_ids IS NULL THEN
    RETURN jsonb_build_object(
      'role', NULL,
      'error', 'NO_ROLE',
      'summary', jsonb_build_object('po_count', 0, 'total_payable', 0, 'overdue', 0, 'payable_7d', 0)
    );
  END IF;

  SELECT COALESCE(bc.base_currency, 'INR') INTO v_base_currency
  FROM public.buyer_companies bc
  WHERE bc.id = v_company_ids[1]
  LIMIT 1;

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
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND COALESCE(po.payment_status,'') <> 'paid') AS due_7d,
      (COALESCE(po.payment_status,'') <> 'paid') AS is_payable,
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

  WITH base AS (
    SELECT public.get_po_lifecycle_stage(
      po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
    ) AS stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  )
  SELECT COALESCE(jsonb_object_agg(stage, cnt), '{}'::jsonb)
  INTO v_stage_counts
  FROM (SELECT stage, COUNT(*) AS cnt FROM base GROUP BY stage) s;

  WITH base AS (
    SELECT
      po.created_by,
      COALESCE(pr.company_name, pr.contact_person, 'User ' || LEFT(po.created_by::text,6)) AS purchaser_name,
      po.po_value_base_currency,
      po.ceo_override,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue,
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

  v_summary := jsonb_build_object(
    'po_count', v_total_pos,
    'total_payable', v_total_payable,
    'overdue', v_overdue_value,
    'payable_7d', v_payable_7d,
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
$function$;

-- =========================================================
-- 3) Strict approver guard in 48H escalation:
--    if no approver resolvable AND no escalation target,
--    we already audit. Now: if approver is NULL (no accountable
--    owner), we audit and SKIP rather than silently proceed.
-- =========================================================
CREATE OR REPLACE FUNCTION public.escalate_overdue_override_acks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row RECORD;
  v_approver uuid;
  v_escalation_target uuid;
  v_attempts int;
  v_reminders int := 0;
  v_escalations int := 0;
  v_stale int := 0;
  v_updated int;
BEGIN
  -- A) 24H REMINDERS
  FOR v_row IN
    SELECT id, po_number, created_by
    FROM public.purchase_orders
    WHERE ceo_override = true
      AND approval_status = 'pending_ack'
      AND ceo_override_at < now() - interval '24 hours'
  LOOP
    SELECT approver_id INTO v_approver
    FROM public.get_po_approver(v_row.id)
    LIMIT 1;

    v_approver := COALESCE(v_approver, v_row.created_by);
    IF v_approver IS NULL THEN
      INSERT INTO public.governance_audit_log(actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'reminder_skipped_no_approver', 'purchase_order', v_row.id,
        jsonb_build_object('stage','REMINDER_24H'));
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.governance_notifications
      WHERE user_id = v_approver
        AND type = 'po_override_ack_reminder'
        AND entity_id = v_row.id
        AND (metadata->>'stage') = 'REMINDER_24H'
        AND created_at > now() - interval '12 hours'
    ) THEN CONTINUE; END IF;

    SELECT COUNT(*) INTO v_attempts
    FROM public.governance_notifications
    WHERE type = 'po_override_ack_reminder'
      AND entity_id = v_row.id
      AND user_id = v_approver
      AND (metadata->>'stage') = 'REMINDER_24H';

    PERFORM public.create_governance_notification(
      v_approver,
      'po_override_ack_reminder',
      'Reminder: CEO Override Awaiting Acknowledgement',
      'PO ' || COALESCE(v_row.po_number, v_row.id::text) || ' pending >24h.',
      'purchase_order',
      v_row.id,
      jsonb_build_object('stage','REMINDER_24H','attempt', v_attempts + 1)
    );
    v_reminders := v_reminders + 1;
  END LOOP;

  -- B) 48H ESCALATION — atomic + strict approver guard
  FOR v_row IN
    SELECT id, buyer_company_id, po_number, ceo_override_by
    FROM public.purchase_orders
    WHERE ceo_override = true
      AND approval_status = 'pending_ack'
      AND ceo_override_at < now() - interval '48 hours'
      AND escalated_at IS NULL
  LOOP
    SELECT approver_id INTO v_approver
    FROM public.get_po_approver(v_row.id)
    LIMIT 1;

    -- Strict guard: no accountable owner → audit + skip
    IF v_approver IS NULL THEN
      INSERT INTO public.governance_audit_log(actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_approver', 'purchase_order', v_row.id,
        jsonb_build_object('stage','ESCALATION_48H'));
      CONTINUE;
    END IF;

    SELECT bcm.user_id INTO v_escalation_target
    FROM public.buyer_company_members bcm
    WHERE bcm.company_id = v_row.buyer_company_id
      AND bcm.is_active = true
      AND bcm.role IN ('cfo','director')
      AND bcm.user_id <> v_approver
      AND bcm.user_id <> COALESCE(v_row.ceo_override_by,'00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY CASE bcm.role WHEN 'cfo' THEN 1 ELSE 2 END
    LIMIT 1;

    IF v_escalation_target IS NULL THEN
      INSERT INTO public.governance_audit_log(actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_target', 'purchase_order', v_row.id,
        jsonb_build_object('stage','ESCALATION_48H'));
      CONTINUE;
    END IF;

    UPDATE public.purchase_orders
    SET escalated_at = now()
    WHERE id = v_row.id
      AND escalated_at IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN CONTINUE; END IF;

    PERFORM public.create_governance_notification(
      v_escalation_target,
      'po_override_ack_escalation',
      'Escalation: Override Pending >48h',
      'PO ' || COALESCE(v_row.po_number, v_row.id::text) || ' requires intervention.',
      'purchase_order',
      v_row.id,
      jsonb_build_object('stage','ESCALATION_48H')
    );

    INSERT INTO public.governance_audit_log(actor_id, action, entity_type, entity_id, metadata)
    VALUES (NULL, 'override_ack_escalated', 'purchase_order', v_row.id,
      jsonb_build_object('stage','ESCALATION_48H','notified_user', v_escalation_target));

    v_escalations := v_escalations + 1;
  END LOOP;

  -- C) FLAGGED STALE
  FOR v_row IN
    SELECT id, po_number, ceo_override_by
    FROM public.purchase_orders
    WHERE approval_status = 'flagged_for_review'
      AND updated_at < now() - interval '48 hours'
      AND ceo_override_by IS NOT NULL
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.governance_notifications
      WHERE user_id = v_row.ceo_override_by
        AND type = 'po_flagged_stale'
        AND entity_id = v_row.id
        AND created_at > now() - interval '24 hours'
    ) THEN CONTINUE; END IF;

    PERFORM public.create_governance_notification(
      v_row.ceo_override_by,
      'po_flagged_stale',
      'Flagged PO Pending Review',
      'PO ' || COALESCE(v_row.po_number, v_row.id::text) || ' still unresolved.',
      'purchase_order',
      v_row.id,
      jsonb_build_object('stage','FLAGGED_STALE_48H')
    );
    v_stale := v_stale + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'reminders', v_reminders,
    'escalations', v_escalations,
    'stale_flagged', v_stale,
    'run_at', now()
  );
END;
$function$;

-- =========================================================
-- 4) Hot-path partial index for 24H reminder dedup
-- =========================================================
DROP INDEX IF EXISTS public.idx_gov_notif_reminder_lookup;

CREATE INDEX IF NOT EXISTS idx_gov_notif_stage
ON public.governance_notifications (entity_id, user_id, created_at DESC)
WHERE type = 'po_override_ack_reminder'
  AND (metadata->>'stage') = 'REMINDER_24H';
