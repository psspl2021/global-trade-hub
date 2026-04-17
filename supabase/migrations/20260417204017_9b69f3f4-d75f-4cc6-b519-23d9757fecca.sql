-- =============================================================
-- GOVERNANCE OS – PHASE 6.5 FINAL HARDENING (ATOMIC)
-- =============================================================

-- 0) ENUM SAFETY (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'approval_status' AND e.enumlabel = 'expired'
    ) THEN
      ALTER TYPE public.approval_status ADD VALUE 'expired';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'approval_status' AND e.enumlabel = 'force_closed'
    ) THEN
      ALTER TYPE public.approval_status ADD VALUE 'force_closed';
    END IF;
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 1) RESET TRIGGER (SAFE RE-OVERRIDE HANDLING)
CREATE OR REPLACE FUNCTION public.reset_flagged_on_reoverride()
RETURNS trigger
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

DROP TRIGGER IF EXISTS trg_reset_flagged_on_reoverride ON public.purchase_orders;
CREATE TRIGGER trg_reset_flagged_on_reoverride
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.reset_flagged_on_reoverride();

-- 2) PARTIAL INDEX (ACTIVE NOTIFICATIONS PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_gov_notifications_active
ON public.governance_notifications (user_id, created_at DESC)
WHERE archived_at IS NULL;

-- 3) ESCALATION ENGINE (STATE-DRIVEN, SAFE, IDEMPOTENT)
DROP FUNCTION IF EXISTS public.escalate_overdue_override_acks();

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
  -- A) 24H REMINDERS (PER-APPROVER, STAGE ISOLATED)
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

    INSERT INTO public.governance_notifications
      (user_id, type, title, message, entity_type, entity_id, metadata)
    VALUES (
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

  -- B) 48H ESCALATION (STATE-DRIVEN, COMPANY SAFE)
  FOR v_row IN
    SELECT id, company_id, po_number, ceo_override_by
    FROM public.purchase_orders
    WHERE ceo_override = true
      AND approval_status = 'pending_ack'
      AND ceo_override_at < now() - interval '48 hours'
      AND escalated_at IS NULL
  LOOP
    v_approver := public.get_po_approver(v_row.id);

    SELECT bcm.user_id INTO v_escalation_target
    FROM public.buyer_company_members bcm
    WHERE bcm.company_id = v_row.company_id
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

    INSERT INTO public.governance_notifications
      (user_id, type, title, message, entity_type, entity_id, metadata)
    VALUES (
      v_escalation_target,
      'po_override_ack_escalation',
      'Escalation: Override Pending >48h',
      'PO ' || COALESCE(v_row.po_number, v_row.id::text) || ' requires intervention.',
      'purchase_order',
      v_row.id,
      jsonb_build_object('stage','ESCALATION_48H')
    );

    INSERT INTO public.governance_audit_log(actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_escalation_target, 'override_ack_escalated', 'purchase_order', v_row.id,
      jsonb_build_object('stage','ESCALATION_48H'));

    UPDATE public.purchase_orders
    SET escalated_at = now()
    WHERE id = v_row.id;

    v_escalations := v_escalations + 1;
  END LOOP;

  -- C) FLAGGED PO STALE → CEO NOTIFICATION
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

    INSERT INTO public.governance_notifications
      (user_id, type, title, message, entity_type, entity_id, metadata)
    VALUES (
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

-- 4) AUTO FORCE-CLOSE (14 DAY HARD STOP)
CREATE OR REPLACE FUNCTION public.auto_expire_stale_flagged_pos()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  WITH expired AS (
    UPDATE public.purchase_orders
    SET approval_status = 'force_closed',
        updated_at = now()
    WHERE approval_status = 'flagged_for_review'
      AND updated_at < now() - interval '14 days'
    RETURNING id, po_number
  )
  INSERT INTO public.governance_audit_log(actor_id, action, entity_type, entity_id, metadata)
  SELECT NULL, 'po_auto_force_closed', 'purchase_order', id,
         jsonb_build_object('po_number', po_number)
  FROM expired;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('force_closed', v_count, 'run_at', now());
END;
$$;

-- 5) CRON SCHEDULES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('gov-escalation-loop');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('gov-auto-expiry');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'gov-escalation-loop',
      '0 * * * *',
      $cron$ SELECT public.escalate_overdue_override_acks(); $cron$
    );
    PERFORM cron.schedule(
      'gov-auto-expiry',
      '0 3 * * *',
      $cron$ SELECT public.auto_expire_stale_flagged_pos(); $cron$
    );
  END IF;
END $$;