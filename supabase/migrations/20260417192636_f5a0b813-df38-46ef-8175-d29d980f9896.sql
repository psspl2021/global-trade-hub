-- ============================================================
-- 1. Governance notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.governance_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gov_notif_user_unread
  ON public.governance_notifications(user_id, read, created_at DESC);

ALTER TABLE public.governance_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own gov notifications" ON public.governance_notifications;
CREATE POLICY "users read own gov notifications"
  ON public.governance_notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users update own gov notifications" ON public.governance_notifications;
CREATE POLICY "users update own gov notifications"
  ON public.governance_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- No INSERT policy — only SECURITY DEFINER functions write notifications.

-- ============================================================
-- 2. Internal helper to insert notifications
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_governance_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.governance_notifications(
    user_id, type, title, message, entity_type, entity_id, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id, COALESCE(p_metadata,'{}'::jsonb)
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================================
-- 3. Mark notifications read
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_governance_notification_read(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.governance_notifications
  SET read = true, read_at = now()
  WHERE id = p_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_governance_notifications_read()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.governance_notifications
  SET read = true, read_at = now()
  WHERE user_id = auth.uid() AND read = false;
END;
$$;

-- ============================================================
-- 4. Enrich CEO override RPC: better audit metadata + manager notification
-- ============================================================
CREATE OR REPLACE FUNCTION public.ceo_override_approve_po(
  p_po_id uuid,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_po record;
  v_manager uuid;
  v_supplier_name text;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  IF NOT public.has_capability(v_actor, 'can_override_po_approval') THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'REASON_TOO_SHORT',
      'message', 'Override reason must be at least 10 characters');
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PO_NOT_FOUND');
  END IF;

  IF COALESCE(v_po.ceo_override, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_OVERRIDDEN');
  END IF;

  -- Resolve supplier display name (matches the cascade we use elsewhere)
  SELECT COALESCE(NULLIF(p.company_name,''), NULLIF(p.contact_person,''),
                  NULLIF(v_po.vendor_name,''), 'Vendor ' || LEFT(v_po.supplier_id::text,6))
  INTO v_supplier_name
  FROM public.profiles p WHERE p.id = v_po.supplier_id;
  IF v_supplier_name IS NULL THEN
    v_supplier_name := COALESCE(NULLIF(v_po.vendor_name,''), 'Vendor ' || LEFT(v_po.supplier_id::text,6));
  END IF;

  UPDATE public.purchase_orders
  SET ceo_override = true,
      ceo_override_by = v_actor,
      ceo_override_reason = p_reason,
      ceo_override_at = now(),
      approval_status = 'ceo_override_approved'
  WHERE id = p_po_id;

  -- Determine manager target: prefer assigned approver, fall back to creator
  v_manager := COALESCE(v_po.manager_approver_id, v_po.created_by);

  PERFORM public.log_governance_action(
    'override_po', 'purchase_order', p_po_id, p_reason,
    jsonb_build_object(
      'po_number', v_po.po_number,
      'po_value', v_po.po_value_base_currency,
      'supplier_name', v_supplier_name,
      'manager_target', v_manager
    )
  );

  IF v_manager IS NOT NULL AND v_manager <> v_actor THEN
    PERFORM public.create_governance_notification(
      v_manager,
      'po_override_pending_ack',
      'CEO override needs your acknowledgement',
      format('PO %s (%s) was approved via CEO override. Please acknowledge.',
             v_po.po_number, v_supplier_name),
      'purchase_order',
      p_po_id,
      jsonb_build_object(
        'po_number', v_po.po_number,
        'po_value', v_po.po_value_base_currency,
        'supplier_name', v_supplier_name,
        'reason', p_reason
      )
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'po_id', p_po_id, 'manager_notified', v_manager IS NOT NULL);
END;
$$;

-- ============================================================
-- 5. Enrich manager acknowledgement RPC: notify the CEO who overrode
-- ============================================================
CREATE OR REPLACE FUNCTION public.manager_acknowledge_override(p_po_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_po record;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PO_NOT_FOUND');
  END IF;

  IF NOT COALESCE(v_po.ceo_override, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_OVERRIDDEN');
  END IF;

  IF v_po.manager_ack_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_ACKNOWLEDGED');
  END IF;

  UPDATE public.purchase_orders
  SET manager_ack_by = v_actor,
      manager_ack_at = now(),
      approval_status = 'finalized'
  WHERE id = p_po_id;

  PERFORM public.log_governance_action(
    'acknowledge_override', 'purchase_order', p_po_id, NULL,
    jsonb_build_object('po_number', v_po.po_number, 'po_value', v_po.po_value_base_currency)
  );

  -- Notify the CEO who issued the override
  IF v_po.ceo_override_by IS NOT NULL AND v_po.ceo_override_by <> v_actor THEN
    PERFORM public.create_governance_notification(
      v_po.ceo_override_by,
      'po_override_acknowledged',
      'Manager acknowledged your override',
      format('PO %s has been acknowledged and finalized.', v_po.po_number),
      'purchase_order',
      p_po_id,
      jsonb_build_object('po_number', v_po.po_number)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'po_id', p_po_id);
END;
$$;

-- ============================================================
-- 6. Manager queue: list POs awaiting MY acknowledgement
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_pending_override_acks()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RETURN '[]'::jsonb; END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', po.id,
      'po_number', po.po_number,
      'po_value', po.po_value_base_currency,
      'ceo_override_at', po.ceo_override_at,
      'ceo_override_reason', po.ceo_override_reason,
      'ceo_name', COALESCE(NULLIF(cp.contact_person,''), NULLIF(cp.company_name,''), 'CEO'),
      'supplier_name', COALESCE(
        NULLIF(sp.company_name,''), NULLIF(sp.contact_person,''),
        NULLIF(po.vendor_name,''), 'Vendor ' || LEFT(po.supplier_id::text,6)
      )
    ) ORDER BY po.ceo_override_at DESC)
    FROM public.purchase_orders po
    LEFT JOIN public.profiles cp ON cp.id = po.ceo_override_by
    LEFT JOIN public.profiles sp ON sp.id = po.supplier_id
    WHERE po.ceo_override = true
      AND po.manager_ack_at IS NULL
      AND COALESCE(po.manager_approver_id, po.created_by) = v_actor
  ), '[]'::jsonb);
END;
$$;