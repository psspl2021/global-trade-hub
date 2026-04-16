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
  v_insights jsonb := NULL;
  v_total numeric := 0;
  v_overdue numeric := 0;
  v_top_supplier_name text;
  v_top_supplier_value numeric := 0;
  v_supplier_share numeric := 0;
  v_avg_delay numeric := 0;
  v_upcoming jsonb := '[]'::jsonb;
  v_risk text := 'NORMAL';
  v_supplier_risk text := 'NORMAL';
  v_cash_pressure numeric := 0;
  v_priority text := 'STABLE';
  v_actions jsonb := '[]'::jsonb;
  v_upcoming_total numeric := 0;
BEGIN
  SELECT role, array_agg(company_id)
  INTO v_role, v_company_ids
  FROM user_company_access
  WHERE user_id = p_user_id
  GROUP BY role
  LIMIT 1;

  IF v_role IS NULL OR v_company_ids IS NULL OR array_length(v_company_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('error', 'no_role');
  END IF;

  IF v_role = 'manager' THEN
    SELECT array_agg(purchaser_id)
    INTO v_team_ids
    FROM manager_team_mapping
    WHERE manager_id = p_user_id;
  END IF;

  SELECT
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
  INTO v_summary
  FROM purchase_orders po
  WHERE
    po.buyer_company_id = ANY(v_company_ids)
    AND (
      (v_role IN ('ceo', 'cfo'))
      OR (v_role = 'hr')
      OR (v_role = 'manager'
          AND v_team_ids IS NOT NULL
          AND po.created_by = ANY(v_team_ids))
      OR (v_role = 'purchaser' AND po.created_by = p_user_id)
    );

  IF v_role IN ('ceo', 'cfo') THEN
    SELECT
      COALESCE(SUM(po.po_value_base_currency), 0),
      COALESCE(SUM(
        CASE WHEN po.payment_due_date < now()
              AND COALESCE(po.payment_status, '') <> 'paid'
             THEN po.po_value_base_currency ELSE 0 END
      ), 0),
      COALESCE(AVG(
        CASE WHEN po.payment_due_date < now()
              AND COALESCE(po.payment_status, '') <> 'paid'
             THEN EXTRACT(EPOCH FROM (now() - po.payment_due_date)) / 86400.0
        END
      ), 0)
    INTO v_total, v_overdue, v_avg_delay
    FROM purchase_orders po
    WHERE po.buyer_company_id = ANY(v_company_ids);

    SELECT supplier_name, supplier_value
    INTO v_top_supplier_name, v_top_supplier_value
    FROM (
      SELECT
        po.supplier_id,
        COALESCE(MAX(p.company_name), MAX(p.contact_person), LEFT(po.supplier_id::text, 8), 'Unknown') AS supplier_name,
        SUM(po.po_value_base_currency) AS supplier_value
      FROM purchase_orders po
      LEFT JOIN profiles p ON p.id = po.supplier_id
      WHERE po.buyer_company_id = ANY(v_company_ids)
      GROUP BY po.supplier_id
      ORDER BY supplier_value DESC NULLS LAST
      LIMIT 1
    ) t;

    IF v_total > 0 THEN
      v_supplier_share := COALESCE(v_top_supplier_value, 0) / v_total;
      IF (v_overdue / v_total) > 0.3 THEN
        v_risk := 'HIGH';
      END IF;
      IF v_supplier_share > 0.5 THEN
        v_supplier_risk := 'DEPENDENCY_RISK';
      END IF;
    END IF;

    SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
    INTO v_upcoming
    FROM (
      SELECT jsonb_build_object(
        'po_id', po.id,
        'po_number', po.po_number,
        'supplier_name', COALESCE(p.company_name, p.contact_person, LEFT(po.supplier_id::text, 8), 'Unknown'),
        'amount', po.po_value_base_currency,
        'due_date', po.payment_due_date
      ) AS row_data
      FROM purchase_orders po
      LEFT JOIN profiles p ON p.id = po.supplier_id
      WHERE po.buyer_company_id = ANY(v_company_ids)
        AND po.payment_due_date >= now()
        AND po.payment_due_date <= now() + interval '7 days'
        AND COALESCE(po.payment_status, '') <> 'paid'
      ORDER BY po.payment_due_date ASC
      LIMIT 10
    ) sub;

    SELECT COALESCE(SUM((r->>'amount')::numeric), 0)
    INTO v_upcoming_total
    FROM jsonb_array_elements(v_upcoming) r;

    IF v_total > 0 THEN
      v_cash_pressure := LEAST(100,
        (v_overdue / v_total) * 50
        + (v_upcoming_total / v_total) * 30
        + LEAST(v_avg_delay, 30) / 30.0 * 20
      );
    END IF;

    IF v_cash_pressure >= 70 THEN
      v_priority := 'CRITICAL';
    ELSIF v_cash_pressure >= 40 THEN
      v_priority := 'WARNING';
    END IF;

    v_actions := '[]'::jsonb;

    IF v_overdue > 0 THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'type', 'CLEAR_OVERDUE',
        'title', 'Clear overdue payables',
        'impact', ROUND((v_overdue / NULLIF(v_total, 0) * 100)::numeric, 1),
        'description', 'Overdue exposure impacting supplier trust and credit cycle'
      ));
    END IF;

    IF v_supplier_share > 0.5 THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'type', 'DIVERSIFY_SUPPLIERS',
        'title', 'Reduce supplier dependency',
        'impact', ROUND((v_supplier_share * 100)::numeric, 1),
        'description', 'Single supplier concentration risk detected'
      ));
    END IF;

    IF jsonb_array_length(v_upcoming) > 3 THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'type', 'PLAN_CASHFLOW',
        'title', 'Plan upcoming payments',
        'impact', jsonb_array_length(v_upcoming),
        'description', 'Multiple payments due in next 7 days'
      ));
    END IF;

    SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
    INTO v_actions
    FROM (
      SELECT value FROM jsonb_array_elements(v_actions) LIMIT 3
    ) t;

    v_insights := jsonb_build_object(
      'overdue_ratio', CASE WHEN v_total > 0 THEN v_overdue / v_total ELSE 0 END,
      'risk_level', v_risk,
      'avg_payment_delay_days', ROUND(v_avg_delay::numeric, 1),
      'supplier_risk', jsonb_build_object(
        'level', v_supplier_risk,
        'top_supplier', v_top_supplier_name,
        'top_supplier_value', COALESCE(v_top_supplier_value, 0),
        'concentration_pct', ROUND((v_supplier_share * 100)::numeric, 1)
      ),
      'upcoming_payments', v_upcoming,
      'cash_pressure_score', ROUND(v_cash_pressure::numeric, 1),
      'priority', v_priority,
      'actions', v_actions
    );
  END IF;

  RETURN jsonb_build_object(
    'role', v_role,
    'company_ids', v_company_ids,
    'summary', v_summary,
    'insights', v_insights
  );
END;
$$;