-- 1) Soft archive instead of delete
ALTER TABLE public.governance_notifications
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_active
  ON public.governance_notifications (user_id, created_at DESC)
  WHERE archived_at IS NULL;

-- Drop and recreate cleanup (return type may differ)
DROP FUNCTION IF EXISTS public.cleanup_old_governance_notifications();
CREATE FUNCTION public.cleanup_old_governance_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.governance_notifications
  SET archived_at = now()
  WHERE read = true
    AND archived_at IS NULL
    AND created_at < now() - interval '30 days';
END;
$$;

-- 2) Flag override → mark PO state
CREATE OR REPLACE FUNCTION public.manager_flag_override(
  p_po_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_po record;
  v_ceo uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Flag reason must be at least 10 characters';
  END IF;

  SELECT * INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id
    AND ceo_override = true
    AND manager_ack_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PO not eligible for flagging';
  END IF;

  UPDATE public.purchase_orders
  SET approval_status = 'flagged_for_review',
      updated_at = now()
  WHERE id = p_po_id;

  v_ceo := v_po.ceo_override_by;

  INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (v_actor, 'override_flagged_for_review', 'purchase_order', p_po_id,
          jsonb_build_object('reason', p_reason, 'stage', 'FLAGGED', 'po_number', v_po.po_number));

  IF v_ceo IS NOT NULL THEN
    PERFORM public.create_governance_notification(
      v_ceo,
      'po_override_flagged',
      'Manager flagged your override',
      format('PO %s was flagged for review.', v_po.po_number),
      'purchase_order',
      p_po_id,
      jsonb_build_object('reason', p_reason, 'po_number', v_po.po_number)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'status', 'flagged_for_review');
END;
$$;

-- 3) Escalation engine with attempt count + hard stop + approver fallback
CREATE OR REPLACE FUNCTION public.escalate_overdue_override_acks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_approver uuid;
  v_attempts int;
  v_escalation_target uuid;
  v_reminders int := 0;
  v_escalations int := 0;
BEGIN
  -- 24h reminders
  FOR v_row IN
    SELECT po.id AS po_id, po.po_number, po.ceo_override_by, po.created_by, po.ceo_override_at
    FROM public.purchase_orders po
    WHERE po.ceo_override = true
      AND po.manager_ack_at IS NULL
      AND COALESCE(po.approval_status, '') <> 'flagged_for_review'
      AND po.ceo_override_at < now() - interval '24 hours'
  LOOP
    v_approver := (SELECT approver_id FROM public.get_po_approver(v_row.po_id));
    v_approver := COALESCE(v_approver, v_row.created_by);
    IF v_approver IS NULL THEN
      INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_approver', 'purchase_order', v_row.po_id,
              jsonb_build_object('po_number', v_row.po_number));
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.governance_notifications
      WHERE user_id = v_approver
        AND type = 'po_override_ack_reminder'
        AND entity_id = v_row.po_id
        AND created_at > now() - interval '12 hours'
    ) THEN
      CONTINUE;
    END IF;

    SELECT COUNT(*) INTO v_attempts
    FROM public.governance_notifications
    WHERE type = 'po_override_ack_reminder'
      AND entity_id = v_row.po_id;

    PERFORM public.create_governance_notification(
      v_approver,
      'po_override_ack_reminder',
      'Reminder: acknowledge CEO override',
      format('PO %s still awaits your acknowledgement.', v_row.po_number),
      'purchase_order',
      v_row.po_id,
      jsonb_build_object('po_number', v_row.po_number, 'stage', 'REMINDER_24H', 'attempt', v_attempts + 1)
    );
    v_reminders := v_reminders + 1;
  END LOOP;

  -- 48h escalation (one-time hard stop)
  FOR v_row IN
    SELECT po.id AS po_id, po.po_number, po.ceo_override_by, po.created_by
    FROM public.purchase_orders po
    WHERE po.ceo_override = true
      AND po.manager_ack_at IS NULL
      AND COALESCE(po.approval_status, '') <> 'flagged_for_review'
      AND po.ceo_override_at < now() - interval '48 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.governance_audit_log
        WHERE entity_id = po.id
          AND action = 'override_ack_escalated'
      )
  LOOP
    v_approver := COALESCE(
      (SELECT approver_id FROM public.get_po_approver(v_row.po_id)),
      v_row.created_by
    );

    SELECT ur.user_id INTO v_escalation_target
    FROM public.user_roles ur
    WHERE ur.role::text IN ('cfo', 'director')
      AND ur.user_id <> COALESCE(v_approver, '00000000-0000-0000-0000-000000000000'::uuid)
      AND ur.user_id <> COALESCE(v_row.ceo_override_by, '00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY CASE ur.role::text WHEN 'cfo' THEN 1 WHEN 'director' THEN 2 ELSE 3 END
    LIMIT 1;

    IF v_escalation_target IS NULL THEN
      CONTINUE;
    END IF;

    PERFORM public.create_governance_notification(
      v_escalation_target,
      'po_override_escalated',
      'Escalation: unacknowledged CEO override',
      format('PO %s has been pending acknowledgement for 48h.', v_row.po_number),
      'purchase_order',
      v_row.po_id,
      jsonb_build_object('po_number', v_row.po_number, 'stage', 'ESCALATION_48H', 'attempt', 1)
    );

    INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (NULL, 'override_ack_escalated', 'purchase_order', v_row.po_id,
            jsonb_build_object('escalated_to', v_escalation_target, 'po_number', v_row.po_number, 'stage', 'ESCALATION_48H'));

    v_escalations := v_escalations + 1;
  END LOOP;

  RETURN jsonb_build_object('reminders', v_reminders, 'escalations', v_escalations);
END;
$$;

-- 4) Reset flagged status when CEO re-overrides
CREATE OR REPLACE FUNCTION public.reset_flagged_on_reoverride()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ceo_override = true
     AND NEW.ceo_override_at IS DISTINCT FROM OLD.ceo_override_at
     AND OLD.approval_status = 'flagged_for_review' THEN
    NEW.approval_status := 'pending_ack';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_flagged_on_reoverride ON public.purchase_orders;
CREATE TRIGGER trg_reset_flagged_on_reoverride
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.reset_flagged_on_reoverride();