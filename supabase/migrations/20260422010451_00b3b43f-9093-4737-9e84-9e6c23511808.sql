CREATE OR REPLACE FUNCTION public.manager_acknowledge_override(p_po_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT approver_id INTO v_approver
  FROM public.get_po_approver(p_po_id);

  IF v_approver IS NULL OR v_approver <> v_actor THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not the assigned approver for this PO');
  END IF;

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

  -- Resolve supplier label directly from buyer_suppliers (no profiles join — bs has no user_id).
  SELECT COALESCE(bs.company_name, bs.supplier_name, bs.email, 'Vendor ' || left(v_po.supplier_id::text, 8))
  INTO v_supplier_name
  FROM public.buyer_suppliers bs
  WHERE bs.id = v_po.supplier_id;

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
$function$;