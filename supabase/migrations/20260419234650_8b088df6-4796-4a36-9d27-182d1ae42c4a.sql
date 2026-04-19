CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_base_currency text := 'INR';
  v_summary jsonb;
  v_insights jsonb;
  v_pos jsonb;
  v_stage_counts jsonb;
  v_top_purchasers jsonb;
  v_total_pos int := 0;
  v_total_value numeric := 0;
  v_total_payable numeric := 0;
  v_payable_7d numeric := 0;
  v_overdue_count int := 0;
  v_overdue_value numeric := 0;
  v_override_count int := 0;
  v_flagged_count int := 0;
  v_pending_ack_count int := 0;
  v_paid_count int := 0;
  v_finalized_count int := 0;
  v_avg_delay_days numeric := 0;
  v_overdue_pct numeric := 0;
  v_cash_pressure int := 0;
  v_priority text := 'STABLE';
  v_risk_level text := 'NORMAL';
  v_supplier_risk jsonb := jsonb_build_object('level','NORMAL','top_supplier',NULL,'top_supplier_value',0,'concentration_pct',0);
  v_upcoming jsonb := '[]'::jsonb;
  v_actions jsonb := '[]'::jsonb;
  v_root_causes jsonb := jsonb_build_object('sufficient_sample', false, 'sample_size', 0, 'min_sample_required', 3);
BEGIN
  WITH ranked AS (
    SELECT
      uca.role,
      uca.company_id,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE LOWER(uca.role)
            WHEN 'ceo' THEN 1 WHEN 'cfo' THEN 2 WHEN 'director' THEN 3
            WHEN 'manager' THEN 4 WHEN 'purchaser' THEN 5 WHEN 'hr' THEN 6
            ELSE 9 END,
          uca.created_at DESC NULLS LAST
      ) AS rn
    FROM public.user_company_access uca
    WHERE uca.user_id = p_user_id
  ),
  picked AS (SELECT role FROM ranked WHERE rn = 1)
  SELECT p.role, ARRAY_AGG(r.company_id)
  INTO v_role, v_company_ids
  FROM picked p
  JOIN public.user_company_access r
    ON r.user_id = p_user_id AND r.role = p.role
  GROUP BY p.role;

  IF v_role IS NULL OR v_company_ids IS NULL THEN
    RETURN jsonb_build_object(
      'role', NULL, 'error', 'NO_ROLE',
      'summary', jsonb_build_object('po_count',0,'total_payable',0,'overdue',0,'payable_7d',0)
    );
  END IF;

  SELECT COALESCE(bc.base_currency, 'INR') INTO v_base_currency
  FROM public.buyer_companies bc
  WHERE bc.id = v_company_ids[1] LIMIT 1;

  WITH base AS (
    SELECT
      po.id, po.po_number, po.po_value_base_currency, po.payment_due_date,
      po.payment_status, po.created_at, po.created_by, po.ceo_override,
      po.supplier_id, po.spend_category,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND COALESCE(po.payment_status,'') <> 'paid') AS due_7d,
      (COALESCE(po.payment_status,'') <> 'paid') AS is_payable,
      public.get_po_lifecycle_stage(
        po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
      ) AS lifecycle_stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', id,
      'po_number', po_number,
      'amount', po_value_base_currency,
      'due_date', payment_due_date,
      'stage', lifecycle_stage,
      'purchasers', public.get_po_purchasers(id),
      'creator_id', created_by,
      'is_overdue', is_overdue,
      'ceo_override', ceo_override
    ) ORDER BY created_at DESC), '[]'::jsonb),
    COUNT(*),
    COALESCE(SUM(po_value_base_currency), 0),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE is_payable), 0),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE due_7d), 0),
    COUNT(*) FILTER (WHERE is_overdue),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE is_overdue), 0),
    COUNT(*) FILTER (WHERE ceo_override = true),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'FLAGGED'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'PENDING_ACK'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'PAID'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'FINALIZED'),
    COALESCE(AVG(EXTRACT(DAY FROM (CURRENT_DATE - payment_due_date))) FILTER (WHERE is_overdue), 0)
  INTO v_pos, v_total_pos, v_total_value, v_total_payable, v_payable_7d,
       v_overdue_count, v_overdue_value, v_override_count, v_flagged_count,
       v_pending_ack_count, v_paid_count, v_finalized_count, v_avg_delay_days
  FROM base;

  WITH base AS (
    SELECT public.get_po_lifecycle_stage(
      po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
    ) AS stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  )
  SELECT COALESCE(jsonb_object_agg(stage, cnt), '{}'::jsonb)
  INTO v_stage_counts
  FROM (SELECT stage, COUNT(*) AS cnt FROM base GROUP BY stage) s;

  WITH scoped AS (
    SELECT
      po.id AS po_id,
      po.po_value_base_currency,
      po.ceo_override,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue,
      public.get_po_lifecycle_stage(
        po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
      ) AS stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  ),
  linked AS (
    SELECT
      pop.user_id AS purchaser_id,
      COALESCE(pr.company_name, pr.contact_person, 'User ' || LEFT(pop.user_id::text,6)) AS purchaser,
      s.po_value_base_currency, s.ceo_override, s.is_overdue, s.stage
    FROM scoped s
    JOIN public.purchase_order_purchasers pop ON pop.po_id = s.po_id
    LEFT JOIN public.profiles pr ON pr.id = pop.user_id
  )
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_top_purchasers
  FROM (
    SELECT
      purchaser_id, purchaser,
      COUNT(*)::int AS total_pos,
      COALESCE(SUM(po_value_base_currency), 0) AS total_value,
      COUNT(*) FILTER (WHERE is_overdue)::int AS overdue_count,
      COUNT(*) FILTER (WHERE stage IN ('PENDING_ACK','PENDING_APPROVAL','FLAGGED','CEO_OVERRIDE'))::int AS stuck_count,
      COUNT(*) FILTER (WHERE ceo_override = true)::int AS override_count
    FROM linked
    GROUP BY purchaser_id, purchaser
    ORDER BY COALESCE(SUM(po_value_base_currency), 0) DESC
    LIMIT 10
  ) t;

  IF v_total_pos > 0 THEN
    v_overdue_pct := ROUND((v_overdue_count::numeric / v_total_pos::numeric) * 100, 1);
  END IF;
  IF v_total_payable > 0 THEN
    v_cash_pressure := LEAST(100, GREATEST(0, ROUND((v_payable_7d / v_total_payable) * 100)::int));
  END IF;

  IF v_overdue_pct >= 25 OR v_avg_delay_days >= 30 THEN
    v_risk_level := 'HIGH';
  END IF;
  IF v_overdue_pct >= 25 OR v_cash_pressure >= 70 THEN
    v_priority := 'CRITICAL';
  ELSIF v_overdue_pct >= 10 OR v_cash_pressure >= 40 THEN
    v_priority := 'WARNING';
  END IF;

  WITH scoped AS (
    SELECT
      po.supplier_id,
      po.po_value_base_currency,
      (COALESCE(po.payment_status,'') <> 'paid') AS is_payable
    FROM public.get_scoped_purchase_orders(p_user_id) po
    WHERE po.supplier_id IS NOT NULL
  ),
  agg AS (
    SELECT
      s.supplier_id,
      COALESCE(bs.company_name, bs.supplier_name, 'Supplier ' || LEFT(s.supplier_id::text,6)) AS supplier_name,
      SUM(s.po_value_base_currency) FILTER (WHERE s.is_payable) AS payable_value,
      SUM(s.po_value_base_currency) AS total_value
    FROM scoped s
    LEFT JOIN public.buyer_suppliers bs ON bs.id = s.supplier_id
    GROUP BY s.supplier_id, bs.company_name, bs.supplier_name
  ),
  top1 AS (
    SELECT * FROM agg
    ORDER BY COALESCE(payable_value, total_value) DESC NULLS LAST
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'level', CASE
      WHEN v_total_payable > 0
        AND COALESCE((SELECT payable_value FROM top1), 0) / NULLIF(v_total_payable,0) >= 0.5
      THEN 'DEPENDENCY_RISK' ELSE 'NORMAL' END,
    'top_supplier', (SELECT supplier_name FROM top1),
    'top_supplier_value', COALESCE((SELECT payable_value FROM top1), 0),
    'concentration_pct', CASE
      WHEN v_total_payable > 0 THEN
        ROUND((COALESCE((SELECT payable_value FROM top1), 0) / v_total_payable) * 100, 1)
      ELSE 0 END
  )
  INTO v_supplier_risk;

  WITH up AS (
    SELECT
      po.id AS po_id,
      po.po_number,
      po.po_value_base_currency AS amount,
      po.payment_due_date AS due_date,
      COALESCE(bs.company_name, bs.supplier_name, 'Supplier') AS supplier_name
    FROM public.get_scoped_purchase_orders(p_user_id) po
    LEFT JOIN public.buyer_suppliers bs ON bs.id = po.supplier_id
    WHERE po.payment_due_date IS NOT NULL
      AND po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND COALESCE(po.payment_status,'') <> 'paid'
    ORDER BY po.payment_due_date ASC
    LIMIT 25
  )
  SELECT COALESCE(jsonb_agg(row_to_json(up)), '[]'::jsonb) INTO v_upcoming FROM up;

  IF v_overdue_count >= 3 THEN
    WITH overdue_pos AS (
      SELECT
        po.id, po.supplier_id, po.spend_category, po.po_value_base_currency
      FROM public.get_scoped_purchase_orders(p_user_id) po
      WHERE po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid'
    ),
    by_purchaser AS (
      SELECT
        pop.user_id::text AS id,
        COALESCE(pr.company_name, pr.contact_person, 'User ' || LEFT(pop.user_id::text,6)) AS name,
        SUM(o.po_value_base_currency) AS amount,
        COUNT(*)::int AS count
      FROM overdue_pos o
      JOIN public.purchase_order_purchasers pop ON pop.po_id = o.id
      LEFT JOIN public.profiles pr ON pr.id = pop.user_id
      GROUP BY pop.user_id, pr.company_name, pr.contact_person
      ORDER BY SUM(o.po_value_base_currency) DESC NULLS LAST
      LIMIT 5
    ),
    by_supplier AS (
      SELECT
        o.supplier_id::text AS id,
        COALESCE(bs.company_name, bs.supplier_name, 'Supplier ' || LEFT(o.supplier_id::text,6)) AS name,
        SUM(o.po_value_base_currency) AS amount,
        COUNT(*)::int AS count
      FROM overdue_pos o
      LEFT JOIN public.buyer_suppliers bs ON bs.id = o.supplier_id
      WHERE o.supplier_id IS NOT NULL
      GROUP BY o.supplier_id, bs.company_name, bs.supplier_name
      ORDER BY SUM(o.po_value_base_currency) DESC NULLS LAST
      LIMIT 5
    ),
    by_category AS (
      SELECT
        COALESCE(o.spend_category,'uncategorized') AS id,
        COALESCE(o.spend_category,'Uncategorized') AS name,
        SUM(o.po_value_base_currency) AS amount,
        COUNT(*)::int AS count
      FROM overdue_pos o
      GROUP BY o.spend_category
      ORDER BY SUM(o.po_value_base_currency) DESC NULLS LAST
      LIMIT 5
    )
    SELECT jsonb_build_object(
      'sufficient_sample', true,
      'sample_size', v_overdue_count,
      'min_sample_required', 3,
      'purchasers', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', id, 'name', name, 'amount', amount, 'count', count,
          'share_pct', ROUND((amount / NULLIF(v_overdue_value,0)) * 100, 1)
        )) FROM by_purchaser), '[]'::jsonb),
      'suppliers', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', id, 'name', name, 'amount', amount, 'count', count,
          'share_pct', ROUND((amount / NULLIF(v_overdue_value,0)) * 100, 1)
        )) FROM by_supplier), '[]'::jsonb),
      'categories', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', id, 'name', name, 'amount', amount, 'count', count,
          'share_pct', ROUND((amount / NULLIF(v_overdue_value,0)) * 100, 1)
        )) FROM by_category), '[]'::jsonb)
    ) INTO v_root_causes;
  END IF;

  WITH a AS (
    SELECT * FROM (VALUES
      ('REDUCE_OVERDUE',  'Reduce overdue payments',
        'Overdue ratio is above the safe threshold. Prioritize clearing overdue POs.',
        v_overdue_pct,                       (v_overdue_pct >= 10)::int),
      ('PLAN_CASHFLOW',   'Plan cashflow for next 7 days',
        'Several payments are due this week. Confirm liquidity coverage.',
        (SELECT COUNT(*)::numeric FROM jsonb_array_elements(v_upcoming)),
                                              (jsonb_array_length(v_upcoming) >= 3)::int),
      ('DIVERSIFY_SUPPLIERS','Diversify supplier base',
        'A single supplier represents most of payables — concentration risk.',
        COALESCE((v_supplier_risk->>'concentration_pct')::numeric, 0),
        ((v_supplier_risk->>'level') = 'DEPENDENCY_RISK')::int)
    ) AS x(type,title,description,impact,active)
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', type, 'title', title, 'description', description, 'impact', impact
  )), '[]'::jsonb) INTO v_actions
  FROM a WHERE active = 1;

  v_summary := jsonb_build_object(
    'po_count', v_total_pos,
    'total_payable', v_total_payable,
    'overdue', v_overdue_value,
    'payable_7d', v_payable_7d,
    'total_pos', v_total_pos,
    'total_value', v_total_value,
    'overdue_count', v_overdue_count,
    'overdue_value', v_overdue_value,
    'override_count', v_override_count,
    'flagged_count', v_flagged_count,
    'pending_ack_count', v_pending_ack_count,
    'paid_count', v_paid_count,
    'finalized_count', v_finalized_count,
    'base_currency', v_base_currency,
    'stage_counts', v_stage_counts
  );

  v_insights := jsonb_build_object(
    'top_purchasers', v_top_purchasers,
    'stage_counts', v_stage_counts,
    'overdue_pct', v_overdue_pct,
    'overdue_ratio', CASE WHEN v_total_pos>0 THEN v_overdue_count::numeric/v_total_pos ELSE 0 END,
    'avg_payment_delay_days', ROUND(v_avg_delay_days)::int,
    'cash_pressure_score', v_cash_pressure,
    'priority', v_priority,
    'risk_level', v_risk_level,
    'supplier_risk', v_supplier_risk,
    'root_causes', v_root_causes,
    'note', 'Decision Intelligence reconciled with PO data'
  );

  RETURN jsonb_build_object(
    'role', v_role,
    'company_ids', to_jsonb(v_company_ids),
    'base_currency', v_base_currency,
    'summary', v_summary,
    'insights', v_insights,
    'pos', v_pos,
    'actions', v_actions,
    'upcoming_payments', v_upcoming,
    'empty', (v_total_pos = 0)
  );
END;
$function$;