
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_notifications_active_user_created
ON public.governance_notifications (user_id, created_at DESC)
WHERE archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.reset_flagged_on_reoverride()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.approval_status = 'flagged_for_review'
     AND NEW.ceo_override = true
     AND NEW.ceo_override_by IS DISTINCT FROM OLD.ceo_override_by
  THEN
    NEW.approval_status := 'pending_ack';
    NEW.manager_ack_at := NULL;
    NEW.manager_ack_by := NULL;
    NEW.escalated_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.escalate_overdue_override_acks();

CREATE FUNCTION public.escalate_overdue_override_acks()
RETURNS void
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
  v_stale RECORD;
BEGIN
  FOR v_row IN
    SELECT po.id AS po_id, po.created_by, po.ceo_override_at, po.ceo_override_by
    FROM public.purchase_orders po
    WHERE po.ceo_override = true
      AND po.manager_ack_at IS NULL
      AND po.approval_status = 'pending_ack'
      AND po.ceo_override_at < now() - interval '24 hours'
  LOOP
    SELECT approver_id INTO v_approver FROM public.get_po_approver(v_row.po_id);
    IF v_approver IS NULL THEN
      v_approver := v_row.created_by;
      v_approver_type := 'FALLBACK_CREATOR';
    ELSE
      v_approver_type := 'RESOLVED';
    END IF;

    IF v_approver IS NULL THEN
      INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_approver', 'purchase_order', v_row.po_id,
              jsonb_build_object('stage', 'REMINDER_24H'));
      CONTINUE;
    END IF;

    SELECT COUNT(*) INTO v_attempts
    FROM public.governance_notifications
    WHERE type = 'po_override_ack_reminder'
      AND entity_id = v_row.po_id
      AND (metadata->>'stage') = 'REMINDER_24H';

    IF NOT EXISTS (
      SELECT 1 FROM public.governance_notifications
      WHERE user_id = v_approver
        AND type = 'po_override_ack_reminder'
        AND entity_id = v_row.po_id
        AND created_at > now() - interval '12 hours'
    ) THEN
      PERFORM public.create_governance_notification(
        v_approver,
        'po_override_ack_reminder',
        'Reminder: Acknowledge CEO override',
        'A CEO override is awaiting your acknowledgement (>24h overdue).',
        'purchase_order',
        v_row.po_id,
        jsonb_build_object(
          'stage', 'REMINDER_24H',
          'attempt', v_attempts + 1,
          'approver_type', v_approver_type
        )
      );
    END IF;
  END LOOP;

  FOR v_row IN
    SELECT po.id AS po_id, po.created_by, po.ceo_override_by
    FROM public.purchase_orders po
    WHERE po.ceo_override = true
      AND po.manager_ack_at IS NULL
      AND po.approval_status = 'pending_ack'
      AND po.ceo_override_at < now() - interval '48 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.governance_audit_log
        WHERE entity_id = po.id
          AND action = 'override_ack_escalated'
      )
  LOOP
    SELECT approver_id INTO v_approver FROM public.get_po_approver(v_row.po_id);
    IF v_approver IS NULL THEN v_approver := v_row.created_by; END IF;

    SELECT ur.user_id INTO v_escalation_target
    FROM public.user_roles ur
    WHERE ur.role IN ('cfo', 'director')
      AND ur.user_id <> COALESCE(v_row.ceo_override_by, '00000000-0000-0000-0000-000000000000'::uuid)
      AND ur.user_id <> COALESCE(v_approver, '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY CASE ur.role WHEN 'cfo' THEN 1 WHEN 'director' THEN 2 ELSE 3 END
    LIMIT 1;

    IF v_escalation_target IS NULL THEN
      INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_target', 'purchase_order', v_row.po_id,
              jsonb_build_object('stage', 'ESCALATION_48H'));
      CONTINUE;
    END IF;

    UPDATE public.purchase_orders
    SET escalated_at = now()
    WHERE id = v_row.po_id AND escalated_at IS NULL;

    PERFORM public.create_governance_notification(
      v_escalation_target,
      'po_override_ack_escalated',
      'Escalation: CEO override unacknowledged >48h',
      'A CEO-overridden PO has not been acknowledged by the assigned approver.',
      'purchase_order',
      v_row.po_id,
      jsonb_build_object('stage', 'ESCALATION_48H', 'first_escalated_at', now())
    );

    INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (NULL, 'override_ack_escalated', 'purchase_order', v_row.po_id,
            jsonb_build_object('stage', 'ESCALATION_48H', 'escalated_to', v_escalation_target));
  END LOOP;

  FOR v_stale IN
    SELECT po.id AS po_id
    FROM public.purchase_orders po
    WHERE po.approval_status = 'flagged_for_review'
      AND po.updated_at < now() - interval '48 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.governance_audit_log
        WHERE entity_id = po.id
          AND action = 'flagged_po_stale'
          AND created_at > now() - interval '24 hours'
      )
  LOOP
    INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (NULL, 'flagged_po_stale', 'purchase_order', v_stale.po_id,
            jsonb_build_object('stage', 'FLAGGED_STALE_48H'));
  END LOOP;
END;
$$;
