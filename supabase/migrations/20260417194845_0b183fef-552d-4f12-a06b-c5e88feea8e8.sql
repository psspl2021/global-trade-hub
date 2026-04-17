-- 1) Harden escalate_overdue_override_acks: cooldowns + smarter targeting + null guard
CREATE OR REPLACE FUNCTION public.escalate_overdue_override_acks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_approver uuid;
  v_escalatee uuid;
  v_reminders int := 0;
  v_escalations int := 0;
  v_anomalies int := 0;
BEGIN
  FOR v_row IN
    SELECT
      po.id AS po_id,
      po.po_number,
      po.po_value,
      po.ceo_override_at,
      po.ceo_override_by,
      po.buyer_company_id
    FROM public.purchase_orders po
    WHERE po.ceo_override = true
      AND po.manager_ack_at IS NULL
      AND po.ceo_override_at IS NOT NULL
  LOOP
    -- Resolve approver via single source of truth
    SELECT approver_id INTO v_approver FROM public.get_po_approver(v_row.po_id);

    IF v_approver IS NULL THEN
      -- Anomaly: no approver resolvable. Log once per day per PO.
      IF NOT EXISTS (
        SELECT 1 FROM public.governance_audit_log
        WHERE entity_type = 'purchase_order'
          AND entity_id = v_row.po_id
          AND action = 'escalation_anomaly_no_approver'
          AND created_at > now() - interval '24 hours'
      ) THEN
        INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
        VALUES (
          NULL,
          'escalation_anomaly_no_approver',
          'purchase_order',
          v_row.po_id,
          jsonb_build_object(
            'po_number', v_row.po_number,
            'stage', 'ANOMALY',
            'reason', 'get_po_approver returned NULL'
          )
        );
        v_anomalies := v_anomalies + 1;
      END IF;
      CONTINUE;
    END IF;

    -- Stage 1: 24h reminder to approver (cooldown 12h to avoid hourly spam)
    IF v_row.ceo_override_at < now() - interval '24 hours'
       AND v_row.ceo_override_at >= now() - interval '48 hours'
       AND NOT EXISTS (
         SELECT 1 FROM public.governance_notifications
         WHERE user_id = v_approver
           AND type = 'po_override_ack_reminder'
           AND entity_id = v_row.po_id
           AND created_at > now() - interval '12 hours'
       )
    THEN
      PERFORM public.create_governance_notification(
        v_approver,
        'po_override_ack_reminder',
        'Reminder: CEO override needs your acknowledgement',
        format('PO %s has been pending your acknowledgement for over 24 hours.', v_row.po_number),
        'purchase_order',
        v_row.po_id,
        jsonb_build_object('po_number', v_row.po_number, 'stage', 'REMINDER_24H', 'attempt', 1)
      );
      INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
      VALUES (NULL, 'override_ack_reminder_sent', 'purchase_order', v_row.po_id,
        jsonb_build_object('approver_id', v_approver, 'stage', 'REMINDER_24H', 'po_number', v_row.po_number));
      v_reminders := v_reminders + 1;
    END IF;

    -- Stage 2: 48h escalation. Prefer CFO, then Director. Exclude CEO who overrode and the approver.
    IF v_row.ceo_override_at < now() - interval '48 hours' THEN
      SELECT bcm.user_id INTO v_escalatee
      FROM public.buyer_company_members bcm
      WHERE bcm.company_id = v_row.buyer_company_id
        AND bcm.is_active = true
        AND bcm.role IN ('cfo', 'director')
        AND bcm.user_id <> v_approver
        AND bcm.user_id <> COALESCE(v_row.ceo_override_by, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY CASE bcm.role WHEN 'cfo' THEN 1 WHEN 'director' THEN 2 ELSE 9 END
      LIMIT 1;

      IF v_escalatee IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.governance_notifications
           WHERE user_id = v_escalatee
             AND type = 'po_override_escalation'
             AND entity_id = v_row.po_id
             AND created_at > now() - interval '24 hours'
         )
      THEN
        PERFORM public.create_governance_notification(
          v_escalatee,
          'po_override_escalation',
          'Escalation: PO override unacknowledged > 48h',
          format('PO %s (value %s) has been unacknowledged by the assigned approver for over 48 hours.',
            v_row.po_number, v_row.po_value::text),
          'purchase_order',
          v_row.po_id,
          jsonb_build_object('po_number', v_row.po_number, 'stage', 'ESCALATION_48H', 'original_approver', v_approver)
        );
        INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
        VALUES (NULL, 'override_ack_escalated', 'purchase_order', v_row.po_id,
          jsonb_build_object('escalated_to', v_escalatee, 'original_approver', v_approver,
                             'stage', 'ESCALATION_48H', 'po_number', v_row.po_number));
        v_escalations := v_escalations + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'reminders_sent', v_reminders,
    'escalations_sent', v_escalations,
    'anomalies_logged', v_anomalies,
    'ran_at', now()
  );
END;
$$;

-- 2) Notification retention: archive read notifications older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_governance_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted int;
BEGIN
  DELETE FROM public.governance_notifications
  WHERE read = true
    AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN jsonb_build_object('deleted', v_deleted, 'ran_at', now());
END;
$$;

-- 3) Manager "flag for review" action: logs audit, keeps PO open, notifies CEO
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
  v_approver uuid;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not authenticated');
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'reason must be at least 10 characters');
  END IF;

  SELECT id, po_number, ceo_override, ceo_override_by, manager_ack_at
    INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PO not found');
  END IF;
  IF v_po.ceo_override IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'PO is not under CEO override');
  END IF;
  IF v_po.manager_ack_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PO already finalized');
  END IF;

  -- Verify actor is the resolved approver
  SELECT approver_id INTO v_approver FROM public.get_po_approver(p_po_id);
  IF v_approver IS DISTINCT FROM v_actor THEN
    RETURN jsonb_build_object('success', false, 'error', 'not authorized to flag this PO');
  END IF;

  -- Audit
  INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (v_actor, 'override_flagged_for_review', 'purchase_order', p_po_id,
    jsonb_build_object('po_number', v_po.po_number, 'stage', 'FLAGGED', 'reason', p_reason));

  -- Notify CEO who overrode
  IF v_po.ceo_override_by IS NOT NULL THEN
    PERFORM public.create_governance_notification(
      v_po.ceo_override_by,
      'po_override_flagged',
      'Manager flagged your override for review',
      format('PO %s was flagged. Reason: %s', v_po.po_number, p_reason),
      'purchase_order',
      p_po_id,
      jsonb_build_object('po_number', v_po.po_number, 'reason', p_reason, 'flagged_by', v_actor)
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4) Schedule retention cleanup daily at 03:30 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-governance-notifications');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-governance-notifications',
      '30 3 * * *',
      $cron$ SELECT public.cleanup_old_governance_notifications(); $cron$
    );
  END IF;
END$$;