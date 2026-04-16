CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_team_ids uuid[];
  v_summary jsonb;
BEGIN
  -- 1) Resolve role + companies (highest privilege wins)
  SELECT role, array_agg(company_id)
  INTO v_role, v_company_ids
  FROM public.user_company_access
  WHERE user_id = p_user_id
  GROUP BY role
  ORDER BY CASE role
    WHEN 'ceo' THEN 1
    WHEN 'cfo' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'hr' THEN 4
    WHEN 'purchaser' THEN 5
    ELSE 99
  END
  LIMIT 1;

  IF v_role IS NULL OR v_company_ids IS NULL OR array_length(v_company_ids,1) = 0 THEN
    RETURN jsonb_build_object('role', NULL, 'error', 'no_role',
      'summary', jsonb_build_object('po_count',0,'total_payable',0,'overdue',0,'payable_7d',0));
  END IF;

  -- 2) Manager team scope
  IF v_role = 'manager' THEN
    SELECT array_agg(purchaser_id)
    INTO v_team_ids
    FROM public.manager_team_mapping
    WHERE manager_id = p_user_id
      AND company_id = ANY(v_company_ids);
  END IF;

  -- 3) Aggregate
  SELECT
    CASE
      WHEN v_role = 'hr' THEN jsonb_build_object('po_count', COUNT(*))
      ELSE jsonb_build_object(
        'total_payable', COALESCE(SUM(po_value_base_currency),0),
        'overdue', COALESCE(SUM(
          CASE WHEN payment_due_date < now()
                AND COALESCE(payment_status,'unpaid') <> 'paid'
               THEN po_value_base_currency ELSE 0 END
        ),0),
        'payable_7d', COALESCE(SUM(
          CASE WHEN payment_due_date <= now() + interval '7 days'
                AND COALESCE(payment_status,'unpaid') <> 'paid'
               THEN po_value_base_currency ELSE 0 END
        ),0),
        'po_count', COUNT(*)
      )
    END
  INTO v_summary
  FROM public.purchase_orders po
  WHERE po.buyer_company_id = ANY(v_company_ids)
    AND (
      v_role IN ('ceo','cfo','hr')
      OR (v_role = 'purchaser' AND po.created_by = p_user_id)
      OR (v_role = 'manager' AND v_team_ids IS NOT NULL AND po.created_by = ANY(v_team_ids))
    );

  RETURN jsonb_build_object(
    'role', v_role,
    'company_ids', to_jsonb(v_company_ids),
    'scope_users', CASE WHEN v_role='manager' THEN to_jsonb(v_team_ids)
                        WHEN v_role='purchaser' THEN to_jsonb(ARRAY[p_user_id])
                        ELSE NULL END,
    'summary', COALESCE(v_summary, jsonb_build_object('po_count',0,'total_payable',0,'overdue',0,'payable_7d',0))
  );
END;
$$;