-- Drop existing function (return type change requires drop)
DROP FUNCTION IF EXISTS public.escalate_overdue_override_acks();

-- Terminal lifecycle states (only if approval_status is an enum)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status' AND typtype = 'e') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
                   WHERE t.typname='approval_status' AND e.enumlabel='expired') THEN
      ALTER TYPE public.approval_status ADD VALUE 'expired';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
                   WHERE t.typname='approval_status' AND e.enumlabel='force_closed') THEN
      ALTER TYPE public.approval_status ADD VALUE 'force_closed';
    END IF;
  END IF;
END $$;

-- Stronger reset trigger
CREATE OR REPLACE FUNCTION public.reset_flagged_on_reoverride()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.approval_status = 'flagged_for_review'
     AND NEW.ceo_override = true
     AND (
       OLD.ceo_override IS DISTINCT FROM true
       OR NEW.ceo_override_by IS DISTINCT FROM OLD.ceo_override_by
     )
  THEN
    NEW.approval_status := 'pending_ack';
    NEW.escalated_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Refined escalation function
CREATE FUNCTION public.escalate_overdue_override_acks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_approver uuid;
  v_approver_type text;
  v_attempts int;
  v_escalation_target uuid;
  v_reminders_sent int := 0;
  v_escalations_sent int := 0;
  v_stale_notified int := 0;
BEGIN
  -- A) 24h REMINDERS
  FOR v_row IN
    SELECT po.id AS po_id, po.company_id, po.po_number, po.created_by, po.ceo_override_at
    FROM public.purchase_orders po
    WHERE po.ceo_override = true
      AND po.approval_status = 'pending_ack'
      AND po.ceo_override_at < now() - interval '24 hours'
      AND po.escalated_at IS NULL
  LOOP
    v_approver := public.get_po_approver(v_row.po_id);
    IF v_approver IS NULL THEN
      v_approver := v_row.created_by;
      v_approver_type := 'FALLBACK_CREATOR';
    ELSE
      v_approver_type := 'RESOLVED';
    END IF;

    IF v_approver IS NULL THEN
      INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_approver', 'purchase_order', v_row.po_id,
              jsonb_build_object('po_number', v_row.po_number, 'stage', 'REMINDER_24H'));
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.governance_notifications
      WHERE user_id = v_approver
        AND type = 'po_override_ack_reminder'
        AND entity_id = v_row.po_id
        AND (metadata->>'stage') = 'REMINDER_24H'
        AND created_at > now() - interval '12 hours'
    ) THEN
      CONTINUE;
    END IF;

    SELECT COUNT(*) INTO v_attempts
    FROM public.governance_notifications
    WHERE type = 'po_override_ack_reminder'
      AND entity_id = v_row.po_id
      AND user_id = v_approver
      AND (metadata->>'stage') = 'REMINDER_24H';

    INSERT INTO public.governance_notifications
      (user_id, type, title, message, entity_type, entity_id, metadata)
    VALUES (
      v_approver,
      'po_override_ack_reminder',
      'Reminder: CEO Override Awaits Your Acknowledgement',
      'PO ' || COALESCE(v_row.po_number, v_row.po_id::text) || ' has been awaiting your acknowledgement for over 24 hours.',
      'purchase_order',
      v_row.po_id,
      jsonb_build_object('stage', 'REMINDER_24H', 'attempt', v_attempts + 1, 'approver_type', v_approver_type)
    );
    v_reminders_sent := v_reminders_sent + 1;
  END LOOP;

  -- B) 48h ESCALATION (state-driven, company-scoped)
  FOR v_row IN
    SELECT po.id AS po_id, po.company_id, po.po_number, po.created_by,
           po.ceo_override_by, po.ceo_override_at
    FROM public.purchase_orders po
    WHERE po.ceo_override = true
      AND po.approval_status = 'pending_ack'
      AND po.ceo_override_at < now() - interval '48 hours'
      AND po.escalated_at IS NULL
  LOOP
    v_approver := public.get_po_approver(v_row.po_id);

    SELECT bcm.user_id INTO v_escalation_target
    FROM public.buyer_company_members bcm
    WHERE bcm.company_id = v_row.company_id
      AND bcm.is_active = true
      AND bcm.role IN ('cfo', 'director')
      AND bcm.user_id <> COALESCE(v_approver, '00000000-0000-0000-0000-000000000000'::uuid)
      AND bcm.user_id <> COALESCE(v_row.ceo_override_by, '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY CASE bcm.role WHEN 'cfo' THEN 1 WHEN 'director' THEN 2 ELSE 9 END
    LIMIT 1;

    IF v_escalation_target IS NULL THEN
      INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_target', 'purchase_order', v_row.po_id,
              jsonb_build_object('po_number', v_row.po_number, 'company_id', v_row.company_id));
      CONTINUE;
    END IF;

    INSERT INTO public.governance_notifications
      (user_id, type, title, message, entity_type, entity_id, metadata)
    VALUES (
      v_escalation_target,
      'po_override_ack_escalation',
      'Escalation: PO Override Acknowledgement Overdue',
      'PO ' || COALESCE(v_row.po_number, v_row.po_id::text) || ' has been awaiting acknowledgement for over 48 hours.',
      'purchase_order',
      v_row.po_id,
      jsonb_build_object('stage', 'ESCALATION_48H', 'first_escalated_at', now())
    );

    INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_escalation_target, 'override_ack_escalated', 'purchase_order', v_row.po_id,
            jsonb_build_object('stage', 'ESCALATION_48H', 'po_number', v_row.po_number));

    UPDATE public.purchase_orders SET escalated_at = now() WHERE id = v_row.po_id;
    v_escalations_sent := v_escalations_sent + 1;
  END LOOP;

  -- C) STALE FLAGGED PO — actively notify CEO
  FOR v_row IN
    SELECT po.id AS po_id, po.company_id, po.po_number, po.ceo_override_by, po.updated_at
    FROM public.purchase_orders po
    WHERE po.approval_status = 'flagged_for_review'
      AND po.updated_at < now() - interval '48 hours'
      AND po.ceo_override_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.governance_notifications gn
        WHERE gn.user_id = po.ceo_override_by
          AND gn.type = 'po_flagged_stale'
          AND gn.entity_id = po.id
          AND gn.created_at > now() - interval '24 hours'
      )
  LOOP
    INSERT INTO public.governance_notifications
      (user_id, type, title, message, entity_type, entity_id, metadata)
    VALUES (
      v_row.ceo_override_by,
      'po_flagged_stale',
      'Flagged PO Awaiting Your Review',
      'PO ' || COALESCE(v_row.po_number, v_row.po_id::text) || ' has remained in flagged state for over 48 hours.',
      'purchase_order',
      v_row.po_id,
      jsonb_build_object('stage', 'FLAGGED_STALE_48H')
    );

    INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_row.ceo_override_by, 'flagged_po_stale_notified', 'purchase_order', v_row.po_id,
            jsonb_build_object('po_number', v_row.po_number));

    v_stale_notified := v_stale_notified + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'reminders_sent', v_reminders_sent,
    'escalations_sent', v_escalations_sent,
    'stale_flagged_notified', v_stale_notified,
    'run_at', now()
  );
END;
$$;

-- Daily auto-expiry: flagged POs > 14 days → force_closed
CREATE OR REPLACE FUNCTION public.auto_expire_stale_flagged_pos()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH expired AS (
    UPDATE public.purchase_orders
    SET approval_status = 'force_closed', updated_at = now()
    WHERE approval_status = 'flagged_for_review'
      AND updated_at < now() - interval '14 days'
    RETURNING id, po_number
  )
  INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
  SELECT NULL, 'po_auto_force_closed', 'purchase_order', id,
         jsonb_build_object('po_number', po_number, 'reason', 'flagged_stale_14d')
  FROM expired;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('force_closed', v_count, 'run_at', now());
END;
$$;