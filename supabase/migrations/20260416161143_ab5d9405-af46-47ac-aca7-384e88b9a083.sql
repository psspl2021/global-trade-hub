
CREATE OR REPLACE FUNCTION public.get_cfo_decision_intelligence(p_company_id uuid, p_base_currency text DEFAULT 'INR')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_payable numeric := 0;
  v_payable_7d numeric := 0;
  v_overdue_amount numeric := 0;
  v_overdue_worst_days integer := 0;
  v_burn_30d numeric := 0;
  v_burn_prev numeric := 0;
  v_avg_daily_burn numeric := 0;
  v_burn_multiplier numeric := 0;
  v_clearance_days integer := 0;
  v_top_vendor_id text := '';
  v_top_vendor_name text := '';
  v_top_vendor_amount numeric := 0;
  v_top_vendor_share numeric := 0;
  v_total_vendors integer := 0;
  v_has_overdue boolean := false;
  v_concentration_risk boolean := false;
  v_payable_severity text := 'normal';
  v_overdue_severity text := 'normal';
  v_concentration_severity text := 'moderate';
  v_health_score integer := 100;
  v_pressure_score numeric := 0;
  v_confidence numeric := 0;
  v_headline text := '';
  v_fx_rate numeric := 1;
  v_prev_overdue numeric := 0;
  v_prev_payable numeric := 0;
  v_result jsonb;
  v_actions jsonb := '[]'::jsonb;
  v_alerts jsonb := '[]'::jsonb;
  v_trends jsonb := '[]'::jsonb;
  v_insights jsonb;
BEGIN
  -- FX rate
  IF p_base_currency != 'INR' THEN
    SELECT COALESCE(rate, 1) INTO v_fx_rate
    FROM fx_rates
    WHERE from_currency = 'INR' AND to_currency = p_base_currency
    ORDER BY effective_date DESC LIMIT 1;
  END IF;

  -- Total payable (open POs)
  SELECT COALESCE(SUM(po.total_value * v_fx_rate), 0)
  INTO v_total_payable
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status IN ('approved','dispatched','delivered');

  -- Payable due in 7 days
  SELECT COALESCE(SUM(po.total_value * v_fx_rate), 0)
  INTO v_payable_7d
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status IN ('approved','dispatched','delivered')
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) <= now() + interval '7 days';

  -- Overdue amount and worst days
  SELECT COALESCE(SUM(po.total_value * v_fx_rate), 0),
         COALESCE(MAX(EXTRACT(DAY FROM now() - COALESCE(po.payment_due_date, po.expected_delivery_date))::integer), 0)
  INTO v_overdue_amount, v_overdue_worst_days
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status IN ('approved','dispatched','delivered')
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) < now();

  v_has_overdue := v_overdue_amount > 0;

  -- Burn 30d (confirmed payments only)
  SELECT COALESCE(SUM(
    CASE WHEN pal.new_value ~ '^\d+(\.\d+)?$' THEN pal.new_value::numeric * v_fx_rate ELSE 0 END
  ), 0)
  INTO v_burn_30d
  FROM po_payment_audit_logs pal
  WHERE pal.company_id = p_company_id
    AND pal.to_status = 'payment_confirmed'
    AND COALESCE(pal.changed_at, pal.created_at) >= now() - interval '30 days';

  -- Burn previous 30d
  SELECT COALESCE(SUM(
    CASE WHEN pal.new_value ~ '^\d+(\.\d+)?$' THEN pal.new_value::numeric * v_fx_rate ELSE 0 END
  ), 0)
  INTO v_burn_prev
  FROM po_payment_audit_logs pal
  WHERE pal.company_id = p_company_id
    AND pal.to_status = 'payment_confirmed'
    AND COALESCE(pal.changed_at, pal.created_at) >= now() - interval '60 days'
    AND COALESCE(pal.changed_at, pal.created_at) < now() - interval '30 days';

  v_avg_daily_burn := v_burn_30d / 30.0;

  -- Burn multiplier with floor + cap
  IF v_burn_30d >= 10000 THEN
    v_burn_multiplier := LEAST(5, ROUND(v_payable_7d / NULLIF(v_burn_30d / 4.0, 0), 1));
  ELSE
    v_burn_multiplier := 0;
  END IF;

  -- Total vendors (separate query for accurate count)
  SELECT COUNT(DISTINCT po.supplier_id) INTO v_total_vendors
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status IN ('approved','dispatched','delivered');

  -- Top vendor by exposure (stable identity via supplier_id)
  SELECT po.supplier_id,
         MAX(po.vendor_name),
         SUM(po.total_value * v_fx_rate)
  INTO v_top_vendor_id, v_top_vendor_name, v_top_vendor_amount
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status IN ('approved','dispatched','delivered')
  GROUP BY po.supplier_id
  ORDER BY SUM(po.total_value * v_fx_rate) DESC
  LIMIT 1;

  -- Vendor concentration
  IF v_total_payable > 0 THEN
    v_top_vendor_share := ROUND((v_top_vendor_amount / v_total_payable) * 100, 1);
  END IF;
  v_concentration_risk := v_top_vendor_share >= 50;

  -- Concentration severity (isolated)
  v_concentration_severity := CASE
    WHEN v_top_vendor_share >= 80 THEN 'critical'
    WHEN v_top_vendor_share >= 60 THEN 'high'
    ELSE 'moderate'
  END;

  -- Overdue severity (isolated)
  v_overdue_severity := CASE
    WHEN v_overdue_worst_days >= 7 THEN 'critical'
    WHEN v_overdue_amount > 0 THEN 'high'
    ELSE 'normal'
  END;

  -- Overall payable severity (composite)
  IF v_overdue_worst_days >= 7 THEN
    v_payable_severity := 'critical';
  ELSIF v_overdue_amount > 0 THEN
    v_payable_severity := 'high';
  ELSIF v_burn_multiplier >= 2.0 THEN
    v_payable_severity := 'critical';
  ELSIF v_burn_multiplier >= 1.5 OR v_concentration_risk THEN
    v_payable_severity := 'high';
  ELSIF v_payable_7d > 0 THEN
    v_payable_severity := 'elevated';
  ELSE
    v_payable_severity := 'normal';
  END IF;

  -- Clearance days (conditional rounding)
  IF v_avg_daily_burn > 0 THEN
    IF v_payable_severity IN ('high','critical') THEN
      v_clearance_days := CEIL(v_total_payable / v_avg_daily_burn);
    ELSE
      v_clearance_days := ROUND(v_total_payable / v_avg_daily_burn);
    END IF;
  END IF;

  -- Health score (scaled penalties, capped trend penalty)
  v_health_score := GREATEST(0, LEAST(100,
    100
    - LEAST(v_overdue_worst_days * 3, 30)
    - LEAST(GREATEST(v_burn_multiplier - 1, 0) * 20, 25)::integer
    - CASE WHEN v_top_vendor_share >= 80 THEN 20 WHEN v_top_vendor_share >= 60 THEN 12 WHEN v_top_vendor_share >= 50 THEN 6 ELSE 0 END
    - LEAST(15,
        CASE WHEN v_burn_prev >= 10000 AND v_burn_30d > v_burn_prev AND ((v_burn_30d - v_burn_prev) / v_burn_prev) > 0.3 THEN 10
             WHEN v_burn_prev >= 10000 AND v_burn_30d > v_burn_prev AND ((v_burn_30d - v_burn_prev) / v_burn_prev) > 0.15 THEN 5
             ELSE 0 END
        + CASE WHEN v_prev_payable >= 10000 AND v_total_payable > v_prev_payable AND ((v_total_payable - v_prev_payable) / v_prev_payable) > 0.3 THEN 5 ELSE 0 END
      )
  ));

  -- FIX #4: Pressure score — handle overdue>0 with payable=0 edge case
  v_pressure_score := LEAST(3, ROUND(
    CASE
      WHEN v_total_payable > 0 THEN v_overdue_amount / v_total_payable
      WHEN v_overdue_amount > 0 THEN 1
      ELSE 0
    END
    + COALESCE(v_burn_multiplier / 2.0, 0)
  , 2));

  -- Confidence
  v_confidence := LEAST(95,
    40
    + CASE WHEN v_total_payable > 0 THEN 25 ELSE 0 END
    + CASE WHEN (v_burn_30d / 4.0) >= 10000 THEN 20 ELSE 0 END
    + CASE WHEN v_total_vendors >= 3 THEN 10 ELSE 0 END
  );

  -- FIX #5: Headline — concentration ≥60% before moderate burn (<2.5x)
  IF v_payable_severity = 'critical' AND v_has_overdue THEN
    v_headline := format('🔴 %s overdue (%s days) — immediate action required',
      CASE WHEN v_overdue_amount >= 100000 THEN format('₹%sL', ROUND(v_overdue_amount/100000, 1))
           WHEN v_overdue_amount >= 1000 THEN format('₹%sK', ROUND(v_overdue_amount/1000, 0))
           ELSE format('₹%s', ROUND(v_overdue_amount, 0)) END,
      v_overdue_worst_days);
  ELSIF v_has_overdue THEN
    v_headline := format('🟠 %s overdue — clear within 48h to avoid vendor escalation',
      CASE WHEN v_overdue_amount >= 100000 THEN format('₹%sL', ROUND(v_overdue_amount/100000, 1))
           WHEN v_overdue_amount >= 1000 THEN format('₹%sK', ROUND(v_overdue_amount/1000, 0))
           ELSE format('₹%s', ROUND(v_overdue_amount, 0)) END);
  ELSIF v_burn_multiplier >= 2.5 THEN
    v_headline := format('🟠 %s due this week (%sx burn) — liquidity pressure ahead',
      CASE WHEN v_payable_7d >= 100000 THEN format('₹%sL', ROUND(v_payable_7d/100000, 1))
           WHEN v_payable_7d >= 1000 THEN format('₹%sK', ROUND(v_payable_7d/1000, 0))
           ELSE format('₹%s', ROUND(v_payable_7d, 0)) END,
      v_burn_multiplier);
  ELSIF v_top_vendor_share >= 60 THEN
    v_headline := format('🟡 %s%% vendor concentration (%s) — diversification required', ROUND(v_top_vendor_share), COALESCE(v_top_vendor_name, 'Top vendor'));
  ELSIF v_burn_multiplier >= 2.0 THEN
    v_headline := format('🟠 %s due this week (%sx burn) — monitor liquidity',
      CASE WHEN v_payable_7d >= 100000 THEN format('₹%sL', ROUND(v_payable_7d/100000, 1))
           WHEN v_payable_7d >= 1000 THEN format('₹%sK', ROUND(v_payable_7d/1000, 0))
           ELSE format('₹%s', ROUND(v_payable_7d, 0)) END,
      v_burn_multiplier);
  ELSIF v_total_payable > 0 THEN
    v_headline := format('🟢 %s total payable — clears in ~%s days at current burn',
      CASE WHEN v_total_payable >= 100000 THEN format('₹%sL', ROUND(v_total_payable/100000, 1))
           WHEN v_total_payable >= 1000 THEN format('₹%sK', ROUND(v_total_payable/1000, 0))
           ELSE format('₹%s', ROUND(v_total_payable, 0)) END,
      v_clearance_days);
  ELSE
    v_headline := '✅ No active payable obligations';
  END IF;

  -- FIX #3: Trends — return NULL value when insufficient baseline data
  -- FIX #6: Use 'neutral' impact when current = previous
  IF v_burn_prev >= 10000 THEN
    v_trends := v_trends || jsonb_build_object(
      'metric', 'burn_30d_vs_prev_pct',
      'value', ROUND(((v_burn_30d - v_burn_prev) / v_burn_prev) * 100, 1),
      'direction', CASE WHEN v_burn_30d > v_burn_prev THEN 'up' WHEN v_burn_30d < v_burn_prev THEN 'down' ELSE 'flat' END,
      'impact', CASE WHEN v_burn_30d > v_burn_prev THEN 'negative' WHEN v_burn_30d < v_burn_prev THEN 'positive' ELSE 'neutral' END
    );
  ELSE
    v_trends := v_trends || jsonb_build_object(
      'metric', 'burn_30d_vs_prev_pct',
      'value', NULL,
      'direction', 'insufficient_data',
      'impact', 'neutral'
    );
  END IF;

  -- Overdue trend
  SELECT COALESCE(SUM(po.total_value * v_fx_rate), 0) INTO v_prev_overdue
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status IN ('approved','dispatched','delivered')
    AND COALESCE(po.payment_due_date, po.expected_delivery_date) < now() - interval '7 days';

  IF v_prev_overdue >= 10000 THEN
    v_trends := v_trends || jsonb_build_object(
      'metric', 'overdue_change_pct',
      'value', ROUND(((v_overdue_amount - v_prev_overdue) / v_prev_overdue) * 100, 1),
      'direction', CASE WHEN v_overdue_amount > v_prev_overdue THEN 'up' WHEN v_overdue_amount < v_prev_overdue THEN 'down' ELSE 'flat' END,
      'impact', CASE WHEN v_overdue_amount > v_prev_overdue THEN 'negative' WHEN v_overdue_amount < v_prev_overdue THEN 'positive' ELSE 'neutral' END
    );
  ELSE
    v_trends := v_trends || jsonb_build_object(
      'metric', 'overdue_change_pct',
      'value', NULL,
      'direction', 'insufficient_data',
      'impact', 'neutral'
    );
  END IF;

  -- Payable growth trend
  SELECT COALESCE(SUM(po.total_value * v_fx_rate), 0) INTO v_prev_payable
  FROM purchase_orders po
  WHERE po.buyer_company_id = p_company_id
    AND po.status IN ('approved','dispatched','delivered')
    AND po.created_at < now() - interval '7 days';

  IF v_prev_payable >= 10000 THEN
    v_trends := v_trends || jsonb_build_object(
      'metric', 'payable_growth_pct',
      'value', ROUND(((v_total_payable - v_prev_payable) / v_prev_payable) * 100, 1),
      'direction', CASE WHEN v_total_payable > v_prev_payable THEN 'up' WHEN v_total_payable < v_prev_payable THEN 'down' ELSE 'flat' END,
      'impact', CASE WHEN v_total_payable > v_prev_payable THEN 'negative' WHEN v_total_payable < v_prev_payable THEN 'positive' ELSE 'neutral' END
    );
  ELSE
    v_trends := v_trends || jsonb_build_object(
      'metric', 'payable_growth_pct',
      'value', NULL,
      'direction', 'insufficient_data',
      'impact', 'neutral'
    );
  END IF;

  -- Alerts (using isolated severity per domain)
  IF v_payable_7d > 0 THEN
    v_alerts := v_alerts || jsonb_build_object(
      'type', 'upcoming_dues',
      'severity', CASE WHEN v_payable_7d > v_burn_30d / 4.0 THEN 'high' ELSE 'moderate' END,
      'message', format('%s due in next 7 days',
        CASE WHEN v_payable_7d >= 100000 THEN format('₹%sL', ROUND(v_payable_7d/100000, 1))
             ELSE format('₹%sK', ROUND(v_payable_7d/1000, 0)) END)
    );
  END IF;

  IF v_has_overdue THEN
    v_alerts := v_alerts || jsonb_build_object(
      'type', 'overdue_payments',
      'severity', v_overdue_severity,
      'message', format('%s overdue by %s days',
        CASE WHEN v_overdue_amount >= 100000 THEN format('₹%sL', ROUND(v_overdue_amount/100000, 1))
             ELSE format('₹%sK', ROUND(v_overdue_amount/1000, 0)) END,
        v_overdue_worst_days)
    );
  END IF;

  IF v_concentration_risk THEN
    v_alerts := v_alerts || jsonb_build_object(
      'type', 'vendor_concentration',
      'severity', v_concentration_severity,
      'message', format('%s holds %s%% of exposure', COALESCE(v_top_vendor_name, 'Top vendor'), v_top_vendor_share)
    );
  END IF;

  IF v_burn_multiplier >= 1.5 THEN
    v_alerts := v_alerts || jsonb_build_object(
      'type', 'burn_pressure',
      'severity', CASE WHEN v_burn_multiplier >= 2.0 THEN 'critical' ELSE 'high' END,
      'message', format('Burn multiplier at %sx — obligations outpacing spend rate', v_burn_multiplier)
    );
  END IF;

  -- Actions (conflict-aware, capped scoring)
  IF v_has_overdue THEN
    v_actions := v_actions || jsonb_build_object(
      'action', 'clear_overdue',
      'priority', LEAST(100, 60 + LEAST(v_overdue_worst_days, 15) * 2 + CASE WHEN v_overdue_amount > 500000 THEN 10 ELSE 0 END),
      'severity', v_overdue_severity,
      'category', 'overdue',
      'description', format('Clear %s overdue — improves clearance by ~%s days',
        CASE WHEN v_overdue_amount >= 100000 THEN format('₹%sL', ROUND(v_overdue_amount/100000, 1))
             ELSE format('₹%sK', ROUND(v_overdue_amount/1000, 0)) END,
        CASE WHEN v_avg_daily_burn > 0 THEN ROUND(v_overdue_amount / v_avg_daily_burn) ELSE 0 END)
    );
  END IF;

  IF v_concentration_risk AND NOT v_has_overdue THEN
    v_actions := v_actions || jsonb_build_object(
      'action', 'diversify_vendors',
      'priority', CASE WHEN v_top_vendor_share >= 80 THEN 75 WHEN v_top_vendor_share >= 60 THEN 55 ELSE 40 END,
      'severity', v_concentration_severity,
      'category', 'concentration',
      'description', format('Reduce %s dependency (%s%% exposure) — source alternatives', COALESCE(v_top_vendor_name, 'top vendor'), v_top_vendor_share)
    );
  END IF;

  IF v_burn_multiplier >= 1.5 AND NOT v_has_overdue THEN
    v_actions := v_actions || jsonb_build_object(
      'action', 'negotiate_terms',
      'priority', CASE WHEN v_burn_multiplier >= 2.0 THEN 70 ELSE 50 END,
      'severity', CASE WHEN v_burn_multiplier >= 2.0 THEN 'critical' ELSE 'high' END,
      'category', 'burn',
      'description', format('Negotiate extended terms — burn at %sx weekly baseline', v_burn_multiplier)
    );
  END IF;

  -- FIX #7: Deterministic tiebreak — priority DESC, then category ASC
  SELECT COALESCE(jsonb_agg(a ORDER BY (a->>'priority')::int DESC, (a->>'category') ASC), '[]'::jsonb)
  INTO v_actions
  FROM jsonb_array_elements(v_actions) a;

  -- Build insights
  v_insights := jsonb_build_object(
    'payable', jsonb_build_object(
      'total_payable', v_total_payable,
      'payable_7d', v_payable_7d,
      'overdue', v_overdue_amount,
      'overdue_worst_days', v_overdue_worst_days
    ),
    'burn', jsonb_build_object(
      'burn_30d', v_burn_30d,
      'avg_daily_burn', ROUND(v_avg_daily_burn, 2),
      'burn_multiplier', v_burn_multiplier,
      'clearance_days', v_clearance_days
    ),
    'concentration', jsonb_build_object(
      'top_vendor', COALESCE(v_top_vendor_name, ''),
      'top_vendor_amount', COALESCE(v_top_vendor_amount, 0),
      'top_vendor_share', COALESCE(v_top_vendor_share, 0),
      'total_vendors', v_total_vendors,
      'concentration_risk', v_concentration_risk
    )
  );

  -- Final result
  v_result := jsonb_build_object(
    'headline', v_headline,
    'severity', v_payable_severity,
    'health_score', v_health_score,
    'pressure_score', v_pressure_score,
    'confidence', v_confidence,
    'insights', v_insights,
    'trends', v_trends,
    'alerts', v_alerts,
    'actions', v_actions,
    'meta', jsonb_build_object(
      'company_id', p_company_id,
      'currency', p_base_currency,
      'fx_rate', v_fx_rate,
      'computed_at', now()
    )
  );

  RETURN v_result;
END;
$$;
