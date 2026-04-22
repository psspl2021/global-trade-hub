-- Fix functions that reference non-existent column manager_approver_id on purchase_orders
-- The actual column is manager_approved_by

CREATE OR REPLACE FUNCTION public.ceo_override_approve_po(p_po_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Use manager_approved_by (assigned/acted manager) or fall back to creator
  v_manager := COALESCE(v_po.manager_approved_by, v_po.created_by);

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
$function$;

CREATE OR REPLACE FUNCTION public.get_my_pending_override_acks()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      AND COALESCE(po.manager_approved_by, po.created_by) = v_actor
  ), '[]'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_po_approver(p_po_id uuid)
 RETURNS TABLE(approver_id uuid, source text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_po RECORD;
BEGIN
  SELECT id, manager_approved_by, created_by, buyer_company_id
  INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id;

  IF NOT FOUND THEN RETURN; END IF;

  IF v_po.manager_approved_by IS NOT NULL THEN
    approver_id := v_po.manager_approved_by;
    source := 'manager_approver';
    RETURN NEXT; RETURN;
  END IF;

  SELECT pop.user_id INTO approver_id
  FROM public.purchase_order_purchasers pop
  JOIN public.user_company_access uca
    ON uca.user_id = pop.user_id
   AND uca.company_id = v_po.buyer_company_id
  WHERE pop.po_id = p_po_id
    AND LOWER(uca.role) IN ('cfo','director','manager')
  ORDER BY
    CASE LOWER(uca.role)
      WHEN 'cfo' THEN 1
      WHEN 'director' THEN 2
      WHEN 'manager' THEN 3
      ELSE 9
    END,
    pop.added_at ASC
  LIMIT 1;

  IF approver_id IS NOT NULL THEN
    source := 'po_purchaser';
    RETURN NEXT; RETURN;
  END IF;

  SELECT bcm.user_id INTO approver_id
  FROM public.buyer_company_members bcm
  WHERE bcm.company_id = v_po.buyer_company_id
    AND bcm.role = 'manager'
    AND bcm.is_active = true
  ORDER BY bcm.created_at ASC
  LIMIT 1;

  IF approver_id IS NOT NULL THEN
    source := 'company_manager';
    RETURN NEXT; RETURN;
  END IF;

  approver_id := v_po.created_by;
  source := 'creator_fallback';
  RETURN NEXT;
END;
$function$;