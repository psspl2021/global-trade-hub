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
BEGIN
  -- 1. Resolve role + authorized companies
  SELECT role, array_agg(company_id)
  INTO v_role, v_company_ids
  FROM user_company_access
  WHERE user_id = p_user_id
  GROUP BY role
  LIMIT 1;

  IF v_role IS NULL OR v_company_ids IS NULL OR array_length(v_company_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('error', 'no_role');
  END IF;

  -- 2. Manager team scope
  IF v_role = 'manager' THEN
    SELECT array_agg(purchaser_id)
    INTO v_team_ids
    FROM manager_team_mapping
    WHERE manager_id = p_user_id;
  END IF;

  -- 3. Aggregation with hard cross-company guard
  RETURN (
    SELECT jsonb_build_object(
      'role', v_role,
      'company_ids', v_company_ids,
      'summary',
      CASE
        WHEN v_role = 'hr' THEN jsonb_build_object(
          'po_count', COUNT(*),
          'active_purchasers', COUNT(DISTINCT po.created_by)
        )
        ELSE jsonb_build_object(
          'total_payable', COALESCE(SUM(po.po_value_base_currency), 0),
          'overdue', COALESCE(SUM(
            CASE WHEN po.payment_due_date < now()
                  AND COALESCE(po.payment_status, '') <> 'paid'
                 THEN po.po_value_base_currency ELSE 0 END
          ), 0),
          'payable_7d', COALESCE(SUM(
            CASE WHEN po.payment_due_date <= now() + interval '7 days'
                  AND COALESCE(po.payment_status, '') <> 'paid'
                 THEN po.po_value_base_currency ELSE 0 END
          ), 0),
          'po_count', COUNT(*)
        )
      END
    )
    FROM purchase_orders po
    WHERE
      -- HARD GUARD: PO must belong to one of the user's authorized companies
      po.buyer_company_id = ANY(v_company_ids)
      AND (
        -- CEO / CFO / HR: full company scope (already guarded above)
        (v_role IN ('ceo', 'cfo', 'hr'))
        -- Manager: only their mapped team
        OR (v_role = 'manager'
            AND v_team_ids IS NOT NULL
            AND po.created_by = ANY(v_team_ids))
        -- Purchaser: only own POs
        OR (v_role = 'purchaser' AND po.created_by = p_user_id)
      )
  );
END;
$$;