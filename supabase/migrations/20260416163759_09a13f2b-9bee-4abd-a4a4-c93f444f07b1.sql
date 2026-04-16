
CREATE OR REPLACE FUNCTION public.get_cfo_decision_intelligence()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_base_currency text := 'INR';
  v_region_type text := 'india';
  v_currency_symbol text := '₹';
  v_fx_rate numeric := 1;
  v_burn_floor numeric := 10000;
  v_total_payable numeric := 0;
  v_payable_7d numeric := 0;
  v_overdue_amount numeric := 0;
  v_overdue_worst_days int := 0;
  v_burn_30d numeric := 0;
  v_avg_daily_burn numeric := 0;
  v_clearance_days int := 0;
  v_top_vendor text := '';
  v_top_vendor_amount numeric := 0;
  v_top_vendor_share numeric := 0;
  v_total_vendors int := 0;
  v_payable_prev numeric := 0;
  v_overdue_prev numeric := 0;
  v_burn_prev numeric := 0;
  v_burn_multiplier numeric := 0;
  v_has_overdue boolean := false;
  v_has_high_outflow boolean := false;
  v_headline text := '';
  v_confidence int := 50;
  v_actions jsonb := '[]'::jsonb;
  v_alerts jsonb := '[]'::jsonb;
  v_result jsonb;
  v_overdue_vendor_count int := 0;
  v_payable_severity text := 'normal';
  v_due7_severity text := 'normal';
  v_overdue_severity text := 'normal';
  v_concentration_severity text := 'moderate';
  v_concentration_risk boolean := false;
  v_clearance_impact_days int := 0;
  v_action_score int := 0;
  v_formatted_amount text := '';
  v_pressure_score numeric := 0;
  v_health_score int := 100;
  v_burn_trend numeric := 0;
  v_overdue_trend numeric := 0;
  v_payable_trend numeric := 0;
  v_trend_penalty int := 0;
BEGIN
  -- ══════════════════════════════════════════
  -- COMPANY & CURRENCY RESOLUTION
  -- ══════════════════════════════════════════
  SELECT bcm.company_id INTO v_company_id
  FROM buyer_company_members bcm
  WHERE bcm.user_id = auth.uid() AND bcm.is_active = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object(
      'summary', jsonb_build_object('total_payable',0,'payable_7d',0,'overdue',0,'overdue_worst_days',0,'burn_30d',0,'avg_daily_burn',0,'clearance_days',0,'top_vendor','','top_vendor_amount',0,'top_vendor_share',0,'total_vendors',0),
      'insights', jsonb_build_object('payable',jsonb_build_object('severity','normal','concentration_risk',false,'top_vendor','','top_vendor_share',0,'clearance_days',0,'clearance_label','No data'),'due7',jsonb_build_object('severity','normal','burn_multiplier',0,'clearance_impact_days',0,'consequence','No data'),'overdue',jsonb_build_object('severity','normal','worst_days',0,'vendor_count',0,'consequence','No data')),
      'actions','[]'::jsonb,'alerts','[]'::jsonb,'headline','No financial data available',
      'trends', jsonb_build_array(
        jsonb_build_object('metric','burn_30d_vs_prev_pct','value',NULL,'direction','insufficient_data','impact','neutral'),
        jsonb_build_object('metric','overdue_change_pct','value',NULL,'direction','insufficient_data','impact','neutral'),
        jsonb_build_object('metric','payable_growth_pct','value',NULL,'direction','insufficient_data','impact','neutral')
      ),
      'system_confidence',0,'health_score',100,'pressure_score',0,'currency','INR','currency_symbol','₹'
    );
  END IF;

  -- Resolve company currency and region
  SELECT COALESCE(bc.base_currency, 'INR'), COALESCE(bc.region_type, 'india')
  INTO v_base_currency, v_region_type
  FROM buyer_companies bc
  WHERE bc.id = v_company_id;

  -- Currency symbol mapping
  v_currency_symbol := CASE v_base_currency
    WHEN 'INR' THEN '₹'
    WHEN 'USD' THEN '$'
    WHEN 'EUR' THEN '€'
    WHEN 'GBP' THEN '£'
    WHEN 'AED' THEN 'AED '
    WHEN 'SAR' THEN 'SAR '
    WHEN 'SGD' THEN 'S$'
    WHEN 'JPY' THEN '¥'
    WHEN 'CNY' THEN '¥'
    WHEN 'AUD' THEN 'A$'
    WHEN 'CAD' THEN 'C$'
    WHEN 'CHF' THEN 'CHF '
    WHEN 'KRW' THEN '₩'
    WHEN 'THB' THEN '฿'
    WHEN 'MYR' THEN 'RM '
    WHEN 'ZAR' THEN 'R '
    WHEN 'BRL' THEN 'R$'
    WHEN 'MXN' THEN 'MX$'
    WHEN 'NGN' THEN '₦'
    WHEN 'KES' THEN 'KSh '
    WHEN 'EGP' THEN 'E£'
    WHEN 'TRY' THEN '₺'
    WHEN 'IDR' THEN 'Rp '
    WHEN 'PHP' THEN '₱'
    WHEN 'VND' THEN '₫'
    WHEN 'BDT' THEN '৳'
    WHEN 'PKR' THEN 'Rs '
    WHEN 'LKR' THEN 'Rs '
    ELSE v_base_currency || ' '
  END;

  -- FX rate for burn floor normalization (INR-anchored thresholds)
  IF v_base_currency != 'INR' THEN
    SELECT COALESCE(fr.rate, 1) INTO v_fx_rate
    FROM fx_rates fr
    WHERE fr.base_currency = 'INR' AND fr.target_currency = v_base_currency
    ORDER BY fr.effective_date DESC LIMIT 1;
    -- Burn floor: 10000 INR converted to local currency
    v_burn_floor := CASE WHEN v_fx_rate > 0 THEN ROUND(10000 * v_fx_rate, 2) ELSE 10000 END;
  END IF;

  -- ══════════════════════════════════════════
  -- BASE QUERIES (all aligned to financial definition: payment_workflow_status)
  -- ══════════════════════════════════════════

  SELECT COALESCE(SUM(po.po_value_base_currency), 0), COUNT(DISTINCT po.supplier_id)
  INTO v_total_payable, v_total_vendors
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    AND po.status != 'cancelled';

  SELECT COALESCE(SUM(po.po_value_base_currency), 0)
  INTO v_payable_7d
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    AND po.status != 'cancelled'
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) <= now() + interval '7 days'
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) > now();

  SELECT COALESCE(SUM(po.po_value_base_currency), 0),
         COALESCE(MAX(EXTRACT(DAY FROM now() - COALESCE(po.payment_due_date, po.expected_delivery_date))::int), 0),
         COUNT(DISTINCT po.supplier_id)
  INTO v_overdue_amount, v_overdue_worst_days, v_overdue_vendor_count
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    AND po.status != 'cancelled'
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) < now();

  v_has_overdue := v_overdue_amount > 0;

  -- Burn 30d (confirmed payments, FX-normalized via typed columns)
  SELECT COALESCE(SUM(
    CASE
      WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
      THEN pal.amount * pal.payment_exchange_rate
      ELSE pal.amount
    END
  ), 0)
  INTO v_burn_30d
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE pal.to_status = 'payment_confirmed'
    AND po.buyer_company_id = v_company_id
    AND pal.changed_at >= now() - interval '30 days';

  v_avg_daily_burn := CASE WHEN v_burn_30d > 0 THEN ROUND(v_burn_30d / 30.0, 2) ELSE 0 END;

  -- Top vendor grouped by supplier_id
  SELECT MAX(po.vendor_name), SUM(po.po_value_base_currency)
  INTO v_top_vendor, v_top_vendor_amount
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    AND po.status != 'cancelled'
  GROUP BY po.supplier_id
  ORDER BY SUM(po.po_value_base_currency) DESC
  LIMIT 1;

  v_top_vendor := COALESCE(v_top_vendor, '');
  v_top_vendor_amount := COALESCE(v_top_vendor_amount, 0);
  v_top_vendor_share := CASE WHEN v_total_payable > 0 THEN ROUND((v_top_vendor_amount / v_total_payable) * 100, 1) ELSE 0 END;
  v_concentration_risk := v_top_vendor_share >= 50;

  -- ══════════════════════════════════════════
  -- TREND DELTAS
  -- ══════════════════════════════════════════

  SELECT COALESCE(SUM(
    CASE WHEN pal.payment_exchange_rate IS NOT NULL AND pal.payment_exchange_rate > 0
      THEN pal.amount * pal.payment_exchange_rate ELSE pal.amount END
  ), 0)
  INTO v_burn_prev
  FROM po_payment_audit_logs pal
  JOIN purchase_orders po ON po.id = pal.po_id
  WHERE pal.to_status = 'payment_confirmed'
    AND po.buyer_company_id = v_company_id
    AND pal.changed_at >= now() - interval '60 days'
    AND pal.changed_at < now() - interval '30 days';

  SELECT COALESCE(SUM(po.po_value_base_currency), 0)
  INTO v_overdue_prev
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
    AND po.status != 'cancelled'
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) < now() - interval '7 days'
    AND po.created_at <= now() - interval '7 days'
    AND (po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
         OR po.updated_at > now() - interval '7 days');

  SELECT COALESCE(SUM(po.po_value_base_currency), 0)
  INTO v_payable_prev
  FROM purchase_orders po
  WHERE po.buyer_company_id = v_company_id
    AND po.created_at <= now() - interval '7 days'
    AND (po.payment_workflow_status NOT IN ('payment_confirmed','cancelled')
         OR po.updated_at > now() - interval '7 days');

  -- NULL for insufficient baseline (floor is FX-adjusted)
  v_burn_trend := CASE
    WHEN v_burn_prev >= v_burn_floor THEN ROUND(((v_burn_30d - v_burn_prev) / v_burn_prev) * 100, 1)
    ELSE NULL
  END;
  v_overdue_trend := CASE
    WHEN v_overdue_prev >= v_burn_floor THEN ROUND(((v_overdue_amount - v_overdue_prev) / v_overdue_prev) * 100, 1)
    ELSE NULL
  END;
  v_payable_trend := CASE
    WHEN v_payable_prev >= v_burn_floor THEN ROUND(((v_total_payable - v_payable_prev) / v_payable_prev) * 100, 1)
    ELSE NULL
  END;

  -- ══════════════════════════════════════════
  -- BURN MULTIPLIER (FX-adjusted floor)
  -- ══════════════════════════════════════════
  v_burn_multiplier := CASE
    WHEN (v_burn_30d / 4.0) >= v_burn_floor THEN LEAST(5, ROUND(v_payable_7d / (v_burn_30d / 4.0), 1))
    ELSE 0
  END;
  v_has_high_outflow := v_burn_multiplier >= 1.5;

  -- ══════════════════════════════════════════
  -- SEVERITY CLASSIFICATION (unchanged — currency-independent)
  -- ══════════════════════════════════════════
  v_overdue_severity := CASE
    WHEN v_overdue_worst_days >= 14 THEN 'critical'
    WHEN v_overdue_worst_days >= 7 THEN 'high'
    WHEN v_overdue_amount > 0 THEN 'moderate'
    ELSE 'normal'
  END;

  v_due7_severity := CASE
    WHEN v_burn_multiplier >= 2.5 THEN 'critical'
    WHEN v_burn_multiplier >= 1.5 THEN 'high'
    WHEN v_payable_7d > 0 THEN 'moderate'
    ELSE 'normal'
  END;

  v_concentration_severity := CASE
    WHEN v_top_vendor_share >= 80 THEN 'critical'
    WHEN v_top_vendor_share >= 60 THEN 'high'
    WHEN v_top_vendor_share >= 50 THEN 'moderate'
    ELSE 'normal'
  END;

  v_payable_severity := CASE
    WHEN v_overdue_worst_days >= 7 OR v_burn_multiplier >= 2.5 THEN 'critical'
    WHEN v_overdue_amount > 0 OR v_burn_multiplier >= 1.5 OR v_concentration_risk THEN 'high'
    WHEN v_payable_7d > 0 THEN 'elevated'
    WHEN v_total_payable > 0 THEN 'moderate'
    ELSE 'normal'
  END;

  IF v_avg_daily_burn > 0 THEN
    IF v_payable_severity IN ('high','critical') THEN
      v_clearance_days := CEIL(v_total_payable / v_avg_daily_burn);
    ELSE
      v_clearance_days := ROUND(v_total_payable / v_avg_daily_burn);
    END IF;
  ELSE
    v_clearance_days := 0;
  END IF;

  IF v_avg_daily_burn > 0 THEN
    IF v_payable_severity IN ('high','critical') THEN
      v_clearance_impact_days := CEIL(v_payable_7d / v_avg_daily_burn);
    ELSE
      v_clearance_impact_days := ROUND(v_payable_7d / v_avg_daily_burn);
    END IF;
  ELSE
    v_clearance_impact_days := 0;
  END IF;

  -- ══════════════════════════════════════════
  -- AMOUNT FORMATTING HELPER (region-aware)
  -- For India: K (thousands) / L (lakhs) / Cr (crores)
  -- For Global: K (thousands) / M (millions) / B (billions)
  -- ══════════════════════════════════════════
  -- (inline via CASE blocks below)

  -- ══════════════════════════════════════════
  -- HEADLINE (currency-aware)
  -- ══════════════════════════════════════════
  IF v_has_overdue AND v_overdue_worst_days >= 7 THEN
    v_formatted_amount := CASE
      WHEN v_region_type = 'india' THEN
        CASE WHEN v_overdue_amount >= 10000000 THEN ROUND(v_overdue_amount / 10000000.0, 1) || 'Cr'
             WHEN v_overdue_amount >= 100000 THEN ROUND(v_overdue_amount / 100000.0, 1) || 'L'
             ELSE ROUND(v_overdue_amount / 1000.0) || 'K' END
      ELSE
        CASE WHEN v_overdue_amount >= 1000000000 THEN ROUND(v_overdue_amount / 1000000000.0, 1) || 'B'
             WHEN v_overdue_amount >= 1000000 THEN ROUND(v_overdue_amount / 1000000.0, 1) || 'M'
             WHEN v_overdue_amount >= 1000 THEN ROUND(v_overdue_amount / 1000.0) || 'K'
             ELSE ROUND(v_overdue_amount)::text END
    END;
    v_headline := '🔴 ' || v_currency_symbol || v_formatted_amount || ' overdue (' || v_overdue_worst_days || ' days) — supply disruption risk imminent';
  ELSIF v_has_overdue THEN
    v_formatted_amount := CASE
      WHEN v_region_type = 'india' THEN
        CASE WHEN v_overdue_amount >= 10000000 THEN ROUND(v_overdue_amount / 10000000.0, 1) || 'Cr'
             WHEN v_overdue_amount >= 100000 THEN ROUND(v_overdue_amount / 100000.0, 1) || 'L'
             ELSE ROUND(v_overdue_amount / 1000.0) || 'K' END
      ELSE
        CASE WHEN v_overdue_amount >= 1000000000 THEN ROUND(v_overdue_amount / 1000000000.0, 1) || 'B'
             WHEN v_overdue_amount >= 1000000 THEN ROUND(v_overdue_amount / 1000000.0, 1) || 'M'
             WHEN v_overdue_amount >= 1000 THEN ROUND(v_overdue_amount / 1000.0) || 'K'
             ELSE ROUND(v_overdue_amount)::text END
    END;
    v_headline := '🟠 ' || v_currency_symbol || v_formatted_amount || ' overdue — clear within 48h to avoid vendor escalation';
  ELSIF v_burn_multiplier >= 2.0 THEN
    v_formatted_amount := CASE
      WHEN v_region_type = 'india' THEN
        CASE WHEN v_payable_7d >= 10000000 THEN ROUND(v_payable_7d / 10000000.0, 1) || 'Cr'
             WHEN v_payable_7d >= 100000 THEN ROUND(v_payable_7d / 100000.0, 1) || 'L'
             ELSE ROUND(v_payable_7d / 1000.0) || 'K' END
      ELSE
        CASE WHEN v_payable_7d >= 1000000000 THEN ROUND(v_payable_7d / 1000000000.0, 1) || 'B'
             WHEN v_payable_7d >= 1000000 THEN ROUND(v_payable_7d / 1000000.0, 1) || 'M'
             WHEN v_payable_7d >= 1000 THEN ROUND(v_payable_7d / 1000.0) || 'K'
             ELSE ROUND(v_payable_7d)::text END
    END;
    v_headline := '🟠 ' || v_currency_symbol || v_formatted_amount || ' due this week (' || v_burn_multiplier || 'x burn) — liquidity pressure ahead';
  ELSIF v_top_vendor_share >= 60 THEN
    v_headline := '🟡 ' || ROUND(v_top_vendor_share) || '% vendor concentration (' || v_top_vendor || ') — diversification required';
  ELSIF v_total_payable > 0 THEN
    v_formatted_amount := CASE
      WHEN v_region_type = 'india' THEN
        CASE WHEN v_total_payable >= 10000000 THEN ROUND(v_total_payable / 10000000.0, 1) || 'Cr'
             WHEN v_total_payable >= 100000 THEN ROUND(v_total_payable / 100000.0, 1) || 'L'
             ELSE ROUND(v_total_payable / 1000.0) || 'K' END
      ELSE
        CASE WHEN v_total_payable >= 1000000000 THEN ROUND(v_total_payable / 1000000000.0, 1) || 'B'
             WHEN v_total_payable >= 1000000 THEN ROUND(v_total_payable / 1000000.0, 1) || 'M'
             WHEN v_total_payable >= 1000 THEN ROUND(v_total_payable / 1000.0) || 'K'
             ELSE ROUND(v_total_payable)::text END
    END;
    v_headline := '✅ ' || v_currency_symbol || v_formatted_amount || ' payable — clears in ~' || v_clearance_days || ' days at current burn';
  ELSE
    v_headline := '✅ No outstanding payables — financial position clear';
  END IF;

  -- ══════════════════════════════════════════
  -- ACTIONS (currency-aware formatting)
  -- ══════════════════════════════════════════
  IF v_has_overdue THEN
    v_formatted_amount := CASE
      WHEN v_region_type = 'india' THEN
        CASE WHEN v_overdue_amount >= 10000000 THEN ROUND(v_overdue_amount/10000000.0,1)||'Cr'
             WHEN v_overdue_amount >= 100000 THEN ROUND(v_overdue_amount/100000.0,1)||'L'
             ELSE ROUND(v_overdue_amount/1000.0)||'K' END
      ELSE
        CASE WHEN v_overdue_amount >= 1000000000 THEN ROUND(v_overdue_amount/1000000000.0,1)||'B'
             WHEN v_overdue_amount >= 1000000 THEN ROUND(v_overdue_amount/1000000.0,1)||'M'
             WHEN v_overdue_amount >= 1000 THEN ROUND(v_overdue_amount/1000.0)||'K'
             ELSE ROUND(v_overdue_amount)::text END
    END;
    v_action_score := LEAST(100, 60 + v_overdue_worst_days * 2 + CASE WHEN v_overdue_amount > 500000 THEN 10 ELSE 0 END);
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', 'Clear ' || v_currency_symbol || v_formatted_amount || ' overdue across ' || v_overdue_vendor_count || ' vendor(s)',
      'impact', 'Improves clearance by ~' || CASE WHEN v_avg_daily_burn > 0 THEN CEIL(v_overdue_amount / v_avg_daily_burn) ELSE 0 END || ' days',
      'priority_score', v_action_score,
      'category', 'overdue_clearance',
      'confidence', CASE WHEN v_overdue_worst_days >= 14 THEN 95 WHEN v_overdue_worst_days >= 7 THEN 85 ELSE 75 END
    ));
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type','overdue_risk','severity',v_overdue_severity,'metric',v_overdue_worst_days,
      'message',v_overdue_worst_days||' days overdue — '||v_overdue_vendor_count||' vendor(s) affected'
    ));
  END IF;

  IF v_has_high_outflow THEN
    v_formatted_amount := CASE
      WHEN v_region_type = 'india' THEN
        CASE WHEN v_payable_7d >= 10000000 THEN ROUND(v_payable_7d/10000000.0,1)||'Cr'
             WHEN v_payable_7d >= 100000 THEN ROUND(v_payable_7d/100000.0,1)||'L'
             ELSE ROUND(v_payable_7d/1000.0)||'K' END
      ELSE
        CASE WHEN v_payable_7d >= 1000000000 THEN ROUND(v_payable_7d/1000000000.0,1)||'B'
             WHEN v_payable_7d >= 1000000 THEN ROUND(v_payable_7d/1000000.0,1)||'M'
             WHEN v_payable_7d >= 1000 THEN ROUND(v_payable_7d/1000.0)||'K'
             ELSE ROUND(v_payable_7d)::text END
    END;
    v_action_score := LEAST(95, 50 + ROUND(v_burn_multiplier * 10));
    IF NOT v_has_overdue THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'action', 'Review ' || v_currency_symbol || v_formatted_amount || ' due this week — ' || v_burn_multiplier || 'x normal burn',
        'impact', 'Prevents ' || v_clearance_impact_days || ' day clearance extension',
        'priority_score', v_action_score,
        'category', 'outflow_management',
        'confidence', CASE WHEN v_burn_multiplier >= 2.5 THEN 90 ELSE 75 END
      ));
    END IF;
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type','high_outflow','severity',v_due7_severity,'metric',v_burn_multiplier,
      'message',v_burn_multiplier||'x burn this week'
    ));
  END IF;

  IF v_concentration_risk THEN
    v_action_score := LEAST(85, 40 + ROUND(v_top_vendor_share));
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'action', 'Diversify away from ' || v_top_vendor || ' (' || ROUND(v_top_vendor_share) || '% exposure)',
      'impact', 'Reduces single-vendor disruption risk',
      'priority_score', v_action_score,
      'category', 'concentration_risk',
      'confidence', 70
    ));
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'type','vendor_concentration','severity',v_concentration_severity,'metric',v_top_vendor_share,
      'message',ROUND(v_top_vendor_share)||'% concentrated on '||v_top_vendor
    ));
  END IF;

  SELECT COALESCE(jsonb_agg(a ORDER BY (a->>'priority_score')::int DESC, (a->>'category') ASC), '[]'::jsonb)
  INTO v_actions
  FROM jsonb_array_elements(v_actions) a;

  -- ══════════════════════════════════════════
  -- PRESSURE SCORE
  -- ══════════════════════════════════════════
  v_pressure_score := LEAST(3, ROUND(
    CASE
      WHEN v_total_payable > 0 THEN v_overdue_amount / v_total_payable
      WHEN v_overdue_amount > 0 THEN 1
      ELSE 0
    END
    + COALESCE(v_burn_multiplier / 2.0, 0)
  , 2));

  -- ══════════════════════════════════════════
  -- HEALTH SCORE
  -- ══════════════════════════════════════════
  v_trend_penalty := LEAST(15,
    CASE WHEN COALESCE(v_burn_trend, 0) > 30 THEN 10 WHEN COALESCE(v_burn_trend, 0) > 15 THEN 5 ELSE 0 END
    + CASE WHEN COALESCE(v_payable_trend, 0) > 30 THEN 5 ELSE 0 END
  );

  v_health_score := GREATEST(0, 100
    - LEAST(v_overdue_worst_days * 3, 30)
    - CASE WHEN v_burn_multiplier > 1 THEN LEAST(((v_burn_multiplier - 1) * 20)::int, 25) ELSE 0 END
    - CASE WHEN v_top_vendor_share >= 80 THEN 15 WHEN v_top_vendor_share >= 60 THEN 10 WHEN v_concentration_risk THEN 5 ELSE 0 END
    - v_trend_penalty
  );

  -- ══════════════════════════════════════════
  -- CONFIDENCE
  -- ══════════════════════════════════════════
  v_confidence := LEAST(95,
    40
    + CASE WHEN v_total_payable > 0 THEN 25 ELSE 0 END
    + CASE WHEN (v_burn_30d / 4.0) >= v_burn_floor THEN 20 ELSE 0 END
    + CASE WHEN v_total_vendors >= 3 THEN 10 ELSE 0 END
  );

  -- ══════════════════════════════════════════
  -- FINAL RESULT (includes currency metadata)
  -- ══════════════════════════════════════════
  v_result := jsonb_build_object(
    'summary', jsonb_build_object(
      'total_payable', v_total_payable,
      'payable_7d', v_payable_7d,
      'overdue', v_overdue_amount,
      'overdue_worst_days', v_overdue_worst_days,
      'burn_30d', v_burn_30d,
      'avg_daily_burn', v_avg_daily_burn,
      'clearance_days', v_clearance_days,
      'top_vendor', v_top_vendor,
      'top_vendor_amount', v_top_vendor_amount,
      'top_vendor_share', v_top_vendor_share,
      'total_vendors', v_total_vendors
    ),
    'insights', jsonb_build_object(
      'payable', jsonb_build_object(
        'severity', v_payable_severity,
        'concentration_risk', v_concentration_risk,
        'top_vendor', v_top_vendor,
        'top_vendor_share', v_top_vendor_share,
        'clearance_days', v_clearance_days,
        'clearance_label', 'Clears in ~' || v_clearance_days || ' days at current burn'
      ),
      'due7', jsonb_build_object(
        'severity', v_due7_severity,
        'burn_multiplier', v_burn_multiplier,
        'clearance_impact_days', v_clearance_impact_days,
        'consequence', CASE
          WHEN v_burn_multiplier >= 2.5 THEN '🔴 Critical: ' || v_burn_multiplier || 'x burn — immediate review required'
          WHEN v_burn_multiplier >= 1.5 THEN '🟠 High outflow week — monitor liquidity'
          WHEN v_payable_7d > 0 THEN 'Standard outflow within normal range'
          ELSE 'No upcoming payments due'
        END
      ),
      'overdue', jsonb_build_object(
        'severity', v_overdue_severity,
        'worst_days', v_overdue_worst_days,
        'vendor_count', v_overdue_vendor_count,
        'consequence', CASE
          WHEN v_overdue_worst_days >= 14 THEN '🔴 Supply disruption risk — ' || v_overdue_vendor_count || ' vendor(s) may halt supply'
          WHEN v_overdue_worst_days >= 7 THEN '🟠 Vendor relationships at risk — clear within 48h'
          WHEN v_overdue_amount > 0 THEN 'Minor overdue — schedule clearance'
          ELSE 'No overdue payments'
        END
      )
    ),
    'actions', v_actions,
    'alerts', v_alerts,
    'headline', v_headline,
    'trends', jsonb_build_array(
      jsonb_build_object('metric','burn_30d_vs_prev_pct','value', v_burn_trend,
        'direction', CASE WHEN v_burn_trend IS NULL THEN 'insufficient_data' WHEN v_burn_trend > 0 THEN 'up' WHEN v_burn_trend < 0 THEN 'down' ELSE 'flat' END,
        'impact', CASE WHEN v_burn_trend IS NULL THEN 'neutral' WHEN v_burn_trend > 0 THEN 'negative' WHEN v_burn_trend < 0 THEN 'positive' ELSE 'neutral' END),
      jsonb_build_object('metric','overdue_change_pct','value', v_overdue_trend,
        'direction', CASE WHEN v_overdue_trend IS NULL THEN 'insufficient_data' WHEN v_overdue_trend > 0 THEN 'up' WHEN v_overdue_trend < 0 THEN 'down' ELSE 'flat' END,
        'impact', CASE WHEN v_overdue_trend IS NULL THEN 'neutral' WHEN v_overdue_trend > 0 THEN 'negative' WHEN v_overdue_trend < 0 THEN 'positive' ELSE 'neutral' END),
      jsonb_build_object('metric','payable_growth_pct','value', v_payable_trend,
        'direction', CASE WHEN v_payable_trend IS NULL THEN 'insufficient_data' WHEN v_payable_trend > 0 THEN 'up' WHEN v_payable_trend < 0 THEN 'down' ELSE 'flat' END,
        'impact', CASE WHEN v_payable_trend IS NULL THEN 'neutral' WHEN v_payable_trend > 0 THEN 'negative' WHEN v_payable_trend < 0 THEN 'positive' ELSE 'neutral' END)
    ),
    'system_confidence', v_confidence,
    'health_score', v_health_score,
    'pressure_score', v_pressure_score,
    'currency', v_base_currency,
    'currency_symbol', v_currency_symbol
  );

  RETURN v_result;
END;
$function$;
