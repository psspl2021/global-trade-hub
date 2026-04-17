-- =========================================================
-- 1. Approver resolution helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_po_approver(p_po_id uuid)
RETURNS TABLE(approver_id uuid, source text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po RECORD;
BEGIN
  SELECT id, manager_approver_id, created_by, buyer_company_id
  INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 1. Explicit approver wins
  IF v_po.manager_approver_id IS NOT NULL THEN
    approver_id := v_po.manager_approver_id;
    source := 'manager_approver';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 2. Delegated manager via buyer_company_members (role = 'manager')
  SELECT bcm.user_id INTO approver_id
  FROM public.buyer_company_members bcm
  WHERE bcm.company_id = v_po.buyer_company_id
    AND bcm.role = 'manager'
    AND bcm.is_active = true
  ORDER BY bcm.created_at ASC
  LIMIT 1;

  IF approver_id IS NOT NULL THEN
    source := 'company_manager';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 3. Fallback: PO creator
  approver_id := v_po.created_by;
  source := 'creator_fallback';
  RETURN NEXT;
END;
$$;

-- =========================================================
-- 2. Idempotent notification creation
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_governance_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_existing uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Idempotency: if there's already an UNREAD notification of the
  -- same type for the same entity & user, do nothing.
  SELECT id INTO v_existing
  FROM public.governance_notifications
  WHERE user_id = p_user_id
    AND type = p_type
    AND entity_id = p_entity_id
    AND read = false
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.governance_notifications
    (user_id, type, title, message, entity_type, entity_id, metadata)
  VALUES
    (p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =========================================================
-- 3. Performance indexes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_gov_audit_action_time
  ON public.governance_audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gov_audit_entity
  ON public.governance_audit_log (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_gov_notif_user_unread
  ON public.governance_notifications (user_id, read, created_at DESC);

-- =========================================================
-- 4. Concurrency-safe manager acknowledgement
-- =========================================================
CREATE OR REPLACE FUNCTION public.manager_acknowledge_override(p_po_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_approver uuid;
  v_po RECORD;
  v_supplier_name text;
  v_ceo_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Resolve the legitimate approver
  SELECT approver_id INTO v_approver
  FROM public.get_po_approver(p_po_id);

  IF v_approver IS NULL OR v_approver <> v_actor THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not the assigned approver for this PO');
  END IF;

  -- Atomic conditional update — wins exactly one caller
  UPDATE public.purchase_orders
  SET manager_ack_by   = v_actor,
      manager_ack_at   = now(),
      approval_status  = 'finalized',
      updated_at       = now()
  WHERE id = p_po_id
    AND ceo_override = true
    AND manager_ack_at IS NULL
  RETURNING * INTO v_po;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PO already acknowledged or not in override state');
  END IF;

  -- Resolve supplier label
  SELECT COALESCE(p.company_name, p.contact_person, bs.supplier_name, 'Vendor ' || left(v_po.supplier_id::text, 8))
  INTO v_supplier_name
  FROM public.buyer_suppliers bs
  LEFT JOIN public.profiles p ON p.id = bs.user_id
  WHERE bs.id = v_po.supplier_id;

  -- Audit
  INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor,
    'manager_acknowledge_override',
    'purchase_order',
    p_po_id,
    jsonb_build_object(
      'po_number', v_po.po_number,
      'po_value', v_po.po_value,
      'supplier_name', v_supplier_name
    )
  );

  -- Notify CEO who overrode
  v_ceo_id := v_po.ceo_override_by;
  IF v_ceo_id IS NOT NULL THEN
    PERFORM public.create_governance_notification(
      v_ceo_id,
      'po_override_acknowledged',
      'Manager acknowledged your override',
      format('PO %s (%s) is now finalized.', v_po.po_number, v_supplier_name),
      'purchase_order',
      p_po_id,
      jsonb_build_object('po_number', v_po.po_number, 'supplier_name', v_supplier_name)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'po_id', p_po_id);
END;
$$;

-- =========================================================
-- 5. Overdue ack discovery + escalation
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_overdue_override_acks(p_hours integer DEFAULT 24)
RETURNS TABLE(
  po_id uuid,
  po_number text,
  po_value numeric,
  ceo_override_at timestamptz,
  hours_overdue numeric,
  approver_id uuid,
  buyer_company_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    po.id,
    po.po_number,
    po.po_value,
    po.ceo_override_at,
    EXTRACT(EPOCH FROM (now() - po.ceo_override_at)) / 3600.0,
    (SELECT approver_id FROM public.get_po_approver(po.id)),
    po.buyer_company_id
  FROM public.purchase_orders po
  WHERE po.ceo_override = true
    AND po.manager_ack_at IS NULL
    AND po.ceo_override_at < now() - make_interval(hours => p_hours);
$$;

CREATE OR REPLACE FUNCTION public.escalate_overdue_override_acks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_reminders int := 0;
  v_escalations int := 0;
  v_secondary uuid;
BEGIN
  FOR v_row IN
    SELECT * FROM public.get_overdue_override_acks(24)
  LOOP
    -- 24h reminder to assigned approver
    IF v_row.approver_id IS NOT NULL THEN
      PERFORM public.create_governance_notification(
        v_row.approver_id,
        'po_override_ack_reminder',
        'Reminder: CEO override still needs your acknowledgement',
        format('PO %s has been awaiting your ack for %s hours.',
               v_row.po_number, round(v_row.hours_overdue, 1)),
        'purchase_order',
        v_row.po_id,
        jsonb_build_object('hours_overdue', v_row.hours_overdue)
      );
      v_reminders := v_reminders + 1;
    END IF;

    -- 48h escalation to CFO / secondary approver
    IF v_row.hours_overdue >= 48 THEN
      SELECT user_id INTO v_secondary
      FROM public.buyer_company_members
      WHERE company_id = v_row.buyer_company_id
        AND role IN ('cfo', 'director', 'ceo')
        AND is_active = true
        AND user_id <> COALESCE(v_row.approver_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY CASE role
                 WHEN 'cfo' THEN 1
                 WHEN 'director' THEN 2
                 WHEN 'ceo' THEN 3
               END
      LIMIT 1;

      IF v_secondary IS NOT NULL THEN
        PERFORM public.create_governance_notification(
          v_secondary,
          'po_override_escalation',
          'Escalation: PO override unacknowledged > 48h',
          format('PO %s has been awaiting acknowledgement for %s hours.',
                 v_row.po_number, round(v_row.hours_overdue, 1)),
          'purchase_order',
          v_row.po_id,
          jsonb_build_object(
            'hours_overdue', v_row.hours_overdue,
            'original_approver_id', v_row.approver_id
          )
        );
        v_escalations := v_escalations + 1;

        INSERT INTO public.governance_audit_log (actor_id, action, entity_type, entity_id, metadata)
        VALUES (
          NULL,
          'po_override_escalated',
          'purchase_order',
          v_row.po_id,
          jsonb_build_object(
            'escalated_to', v_secondary,
            'hours_overdue', v_row.hours_overdue
          )
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'reminders_sent', v_reminders,
    'escalations_sent', v_escalations,
    'run_at', now()
  );
END;
$$;

-- =========================================================
-- 6. Schedule hourly escalation sweep
-- =========================================================
DO $$
BEGIN
  PERFORM cron.unschedule('escalate-overdue-override-acks');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'escalate-overdue-override-acks',
  '0 * * * *',
  $$ SELECT public.escalate_overdue_override_acks(); $$
);