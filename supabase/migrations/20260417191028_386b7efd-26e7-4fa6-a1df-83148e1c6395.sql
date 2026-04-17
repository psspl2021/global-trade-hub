-- Add missing override timing + manager-ack columns
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS ceo_override_at timestamptz,
  ADD COLUMN IF NOT EXISTS manager_ack_by uuid,
  ADD COLUMN IF NOT EXISTS manager_ack_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_po_ceo_override
  ON public.purchase_orders (ceo_override) WHERE ceo_override = true;

-- ============================================================
-- RPC: ceo_override_approve_po
-- ============================================================
CREATE OR REPLACE FUNCTION public.ceo_override_approve_po(
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
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  IF NOT public.has_capability(v_actor, 'can_override_po_approval') THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'REASON_REQUIRED', 'message', 'Override reason must be at least 10 characters');
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  IF COALESCE(v_po.ceo_override, false) = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_OVERRIDDEN');
  END IF;

  UPDATE public.purchase_orders
  SET ceo_override = true,
      ceo_override_by = v_actor,
      ceo_override_reason = p_reason,
      ceo_override_at = now(),
      approval_status = 'ceo_override_approved',
      updated_at = now()
  WHERE id = p_po_id;

  PERFORM public.log_governance_action(
    'override_po',
    'purchase_order',
    p_po_id,
    p_reason,
    jsonb_build_object(
      'po_number', v_po.po_number,
      'po_value', v_po.po_value_base_currency,
      'previous_approval_status', v_po.approval_status,
      'manager_approved_by', v_po.manager_approved_by
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'po_id', p_po_id,
    'requires_manager_ack', true
  );
END;
$$;

-- ============================================================
-- RPC: manager_acknowledge_override
-- ============================================================
CREATE OR REPLACE FUNCTION public.manager_acknowledge_override(p_po_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_po record;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  IF COALESCE(v_po.ceo_override, false) = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_OVERRIDDEN');
  END IF;

  IF v_po.manager_ack_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_ACKNOWLEDGED');
  END IF;

  UPDATE public.purchase_orders
  SET manager_ack_by = v_actor,
      manager_ack_at = now(),
      approval_status = 'finalized',
      updated_at = now()
  WHERE id = p_po_id;

  PERFORM public.log_governance_action(
    'acknowledge_override',
    'purchase_order',
    p_po_id,
    NULL,
    jsonb_build_object(
      'po_number', v_po.po_number,
      'overridden_by', v_po.ceo_override_by,
      'override_reason', v_po.ceo_override_reason
    )
  );

  RETURN jsonb_build_object('success', true, 'po_id', p_po_id);
END;
$$;