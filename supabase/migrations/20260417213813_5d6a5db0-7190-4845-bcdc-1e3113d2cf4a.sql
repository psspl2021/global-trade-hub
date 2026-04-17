CREATE OR REPLACE FUNCTION public.escalate_overdue_override_acks()
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
  v_reminders int := 0;
  v_escalations int := 0;
  v_stale int := 0;
BEGIN
  -- A) 24H REMINDERS
  FOR v_row IN
    SELECT id, po_number, created_by, ceo_override_at
    FROM public.purchase_orders
    WHERE ceo_override = true
      AND approval_status = 'pending_ack'
      AND ceo_override_at < now() - interval '24 hours'
      AND escalated_at IS NULL
  LOOP
    v_approver := public.get_po_approver(v_row.id);
    IF v_approver IS NULL THEN
      v_approver := v_row.created_by;
      v_approver_type := 'FALLBACK_CREATOR';
    ELSE
      v_approver_type := 'RESOLVED';
    END IF;
    IF v_approver IS NULL THEN
      INSERT INTO public.governance_audit_log(actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_approver', 'purchase_order', v_row.id,
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
    ) THEN CONTINUE;
    END IF;
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
      jsonb_build_object(
        'stage','REMINDER_24H',
        'attempt', v_attempts + 1,
        'approver_type', v_approver_type
      )
    );
    v_reminders := v_reminders + 1;
  END LOOP;

  -- B) 48H ESCALATION (FIXED: buyer_company_id)
  FOR v_row IN
    SELECT id, buyer_company_id, po_number, ceo_override_by
    FROM public.purchase_orders
    WHERE ceo_override = true
      AND approval_status = 'pending_ack'
      AND ceo_override_at < now() - interval '48 hours'
      AND escalated_at IS NULL
  LOOP
    v_approver := public.get_po_approver(v_row.id);
    SELECT bcm.user_id INTO v_escalation_target
    FROM public.buyer_company_members bcm
    WHERE bcm.company_id = v_row.buyer_company_id
      AND bcm.is_active = true
      AND bcm.role IN ('cfo','director')
      AND bcm.user_id <> COALESCE(v_approver,'00000000-0000-0000-0000-000000000000'::uuid)
      AND bcm.user_id <> COALESCE(v_row.ceo_override_by,'00000000-0000-0000-0000-000000000000'::uuid)
    ORDER BY CASE bcm.role WHEN 'cfo' THEN 1 ELSE 2 END
    LIMIT 1;
    IF v_escalation_target IS NULL THEN
      INSERT INTO public.governance_audit_log(actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'escalation_anomaly_no_target', 'purchase_order', v_row.id,
        jsonb_build_object('stage','ESCALATION_48H'));
      CONTINUE;
    END IF;
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
    VALUES (
      NULL,
      'override_ack_escalated',
      'purchase_order',
      v_row.id,
      jsonb_build_object(
        'stage','ESCALATION_48H',
        'notified_user', v_escalation_target
      )
    );
    UPDATE public.purchase_orders
    SET escalated_at = now()
    WHERE id = v_row.id;
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
    ) THEN CONTINUE;
    END IF;
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
$$;