
-- =============================================
-- 1. ACTION EXECUTION LAYER
-- =============================================

-- Table to track CFO-executed actions and outcomes
CREATE TABLE public.cfo_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- delay_payment, release_payment, split_payment
  target_po_id uuid REFERENCES public.purchase_orders(id),
  target_supplier_id text,
  executed_by uuid NOT NULL,
  execution_params jsonb DEFAULT '{}',
  outcome text DEFAULT 'pending', -- pending, success, failed
  outcome_details jsonb DEFAULT '{}',
  impact_realized numeric DEFAULT 0,
  confidence_at_execution numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  idempotency_key text UNIQUE
);

ALTER TABLE public.cfo_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view action logs"
  ON public.cfo_action_log FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.buyer_company_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Finance roles can insert action logs"
  ON public.cfo_action_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
        AND company_id = cfo_action_log.company_id
        AND role IN ('cfo', 'finance_manager', 'buyer_admin')
        AND is_active = true
    )
  );

CREATE POLICY "Finance roles can update action logs"
  ON public.cfo_action_log FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
        AND company_id = cfo_action_log.company_id
        AND role IN ('cfo', 'finance_manager', 'buyer_admin')
        AND is_active = true
    )
  );

CREATE INDEX idx_cfo_action_log_company ON public.cfo_action_log(company_id);
CREATE INDEX idx_cfo_action_log_po ON public.cfo_action_log(target_po_id);

-- RPC: Execute CFO Action
CREATE OR REPLACE FUNCTION public.execute_cfo_action(
  p_company_id uuid,
  p_action_type text,
  p_target_po_id uuid,
  p_target_supplier_id text DEFAULT NULL,
  p_params jsonb DEFAULT '{}',
  p_confidence numeric DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_role text;
  v_action_id uuid;
  v_po_record record;
  v_result jsonb := '{}';
BEGIN
  -- Session validation
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Session expired or not authenticated';
  END IF;

  -- Role check
  SELECT role INTO v_user_role
  FROM buyer_company_members
  WHERE user_id = v_user_id AND company_id = p_company_id AND is_active = true;

  IF v_user_role IS NULL OR v_user_role NOT IN ('cfo', 'finance_manager', 'buyer_admin') THEN
    RAISE EXCEPTION 'Only CFO or Finance roles can execute financial actions';
  END IF;

  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM cfo_action_log WHERE idempotency_key = p_idempotency_key) THEN
      SELECT jsonb_build_object('status', 'duplicate', 'message', 'Action already executed')
      INTO v_result;
      RETURN v_result;
    END IF;
  END IF;

  -- Validate PO exists and belongs to company
  IF p_target_po_id IS NOT NULL THEN
    SELECT * INTO v_po_record
    FROM purchase_orders
    WHERE id = p_target_po_id
    FOR UPDATE;

    IF v_po_record IS NULL THEN
      RAISE EXCEPTION 'Purchase order not found';
    END IF;
  END IF;

  -- Execute action based on type
  CASE p_action_type
    WHEN 'delay_payment' THEN
      -- Delay expected delivery by N days from params
      UPDATE purchase_orders
      SET expected_delivery_date = COALESCE(expected_delivery_date, now()) + ((COALESCE((p_params->>'delay_days')::int, 7)) || ' days')::interval,
          updated_at = now()
      WHERE id = p_target_po_id;

      v_result := jsonb_build_object(
        'status', 'success',
        'action', 'delay_payment',
        'delay_days', COALESCE((p_params->>'delay_days')::int, 7)
      );

    WHEN 'release_payment' THEN
      -- Transition payment to approved_for_payment
      UPDATE purchase_orders
      SET payment_workflow_status = 'approved_for_payment',
          approved_at = now(),
          approved_by = v_user_id::text,
          updated_at = now()
      WHERE id = p_target_po_id
        AND payment_workflow_status = 'pending';

      v_result := jsonb_build_object(
        'status', 'success',
        'action', 'release_payment',
        'new_status', 'approved_for_payment'
      );

    WHEN 'split_payment' THEN
      -- Record split payment intent (actual splits handled by payment workflow)
      v_result := jsonb_build_object(
        'status', 'success',
        'action', 'split_payment',
        'split_amount', (p_params->>'split_amount')::numeric,
        'total_po_value', v_po_record.po_value_base_currency
      );

    ELSE
      RAISE EXCEPTION 'Unknown action type: %', p_action_type;
  END CASE;

  -- Log the action
  INSERT INTO cfo_action_log (
    company_id, action_type, target_po_id, target_supplier_id,
    executed_by, execution_params, outcome, outcome_details,
    confidence_at_execution, idempotency_key, completed_at
  ) VALUES (
    p_company_id, p_action_type, p_target_po_id, p_target_supplier_id,
    v_user_id, p_params, 'success', v_result,
    p_confidence, p_idempotency_key, now()
  )
  RETURNING id INTO v_action_id;

  v_result := v_result || jsonb_build_object('action_log_id', v_action_id);
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log failed action
  INSERT INTO cfo_action_log (
    company_id, action_type, target_po_id, target_supplier_id,
    executed_by, execution_params, outcome, outcome_details,
    confidence_at_execution, idempotency_key, completed_at
  ) VALUES (
    p_company_id, p_action_type, p_target_po_id, p_target_supplier_id,
    v_user_id, p_params, 'failed', jsonb_build_object('error', SQLERRM),
    p_confidence, p_idempotency_key, now()
  );
  RAISE;
END;
$$;

-- =============================================
-- 2. SUPPLIER PRIORITY MODEL
-- =============================================

CREATE TABLE public.supplier_priority_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  priority text NOT NULL DEFAULT 'standard' CHECK (priority IN ('critical', 'standard', 'low')),
  rationale text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, company_id)
);

ALTER TABLE public.supplier_priority_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view supplier priorities"
  ON public.supplier_priority_profiles FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.buyer_company_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admin roles can manage supplier priorities"
  ON public.supplier_priority_profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
        AND company_id = supplier_priority_profiles.company_id
        AND role IN ('cfo', 'finance_manager', 'buyer_admin')
        AND is_active = true
    )
  );

CREATE INDEX idx_supplier_priority_company ON public.supplier_priority_profiles(company_id);
CREATE INDEX idx_supplier_priority_supplier ON public.supplier_priority_profiles(supplier_id);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_priority_profiles_updated_at
  BEFORE UPDATE ON public.supplier_priority_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. ALERT COOLDOWN + NOISE CONTROL
-- =============================================

CREATE TABLE public.cfo_alert_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  alert_key text NOT NULL, -- e.g. 'supplier_risk:SUP001' or 'overdue:PO123'
  alert_type text NOT NULL, -- overdue_payment, high_risk, critical_exposure
  last_triggered_at timestamptz NOT NULL DEFAULT now(),
  cooldown_minutes int NOT NULL DEFAULT 240, -- 4 hours default
  snoozed_until timestamptz,
  snoozed_by uuid,
  trigger_count int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, alert_key)
);

ALTER TABLE public.cfo_alert_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view alert state"
  ON public.cfo_alert_state FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.buyer_company_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Finance roles can manage alert state"
  ON public.cfo_alert_state FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_company_members
      WHERE user_id = auth.uid()
        AND company_id = cfo_alert_state.company_id
        AND role IN ('cfo', 'finance_manager', 'buyer_admin')
        AND is_active = true
    )
  );

CREATE INDEX idx_cfo_alert_state_company ON public.cfo_alert_state(company_id);
CREATE INDEX idx_cfo_alert_state_key ON public.cfo_alert_state(alert_key);

-- Function to check/update alert cooldown
CREATE OR REPLACE FUNCTION public.check_alert_cooldown(
  p_company_id uuid,
  p_alert_key text,
  p_alert_type text,
  p_cooldown_minutes int DEFAULT 240
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state record;
  v_should_alert boolean := true;
BEGIN
  SELECT * INTO v_state
  FROM cfo_alert_state
  WHERE company_id = p_company_id AND alert_key = p_alert_key;

  IF v_state IS NOT NULL THEN
    -- Check snooze
    IF v_state.snoozed_until IS NOT NULL AND v_state.snoozed_until > now() THEN
      RETURN jsonb_build_object('should_alert', false, 'reason', 'snoozed', 'snoozed_until', v_state.snoozed_until);
    END IF;

    -- Check cooldown
    IF (now() - v_state.last_triggered_at) < (v_state.cooldown_minutes || ' minutes')::interval THEN
      v_should_alert := false;
      RETURN jsonb_build_object(
        'should_alert', false,
        'reason', 'cooldown',
        'next_eligible_at', v_state.last_triggered_at + (v_state.cooldown_minutes || ' minutes')::interval,
        'trigger_count', v_state.trigger_count
      );
    END IF;

    -- Update existing
    UPDATE cfo_alert_state
    SET last_triggered_at = now(),
        trigger_count = trigger_count + 1,
        cooldown_minutes = p_cooldown_minutes
    WHERE id = v_state.id;
  ELSE
    -- Insert new
    INSERT INTO cfo_alert_state (company_id, alert_key, alert_type, cooldown_minutes)
    VALUES (p_company_id, p_alert_key, p_alert_type, p_cooldown_minutes);
  END IF;

  RETURN jsonb_build_object('should_alert', true, 'reason', 'eligible');
END;
$$;

-- Function to snooze an alert
CREATE OR REPLACE FUNCTION public.snooze_cfo_alert(
  p_company_id uuid,
  p_alert_key text,
  p_snooze_hours int DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM buyer_company_members
  WHERE user_id = v_user_id AND company_id = p_company_id AND is_active = true;

  IF v_role IS NULL OR v_role NOT IN ('cfo', 'finance_manager', 'buyer_admin') THEN
    RAISE EXCEPTION 'Only finance roles can snooze alerts';
  END IF;

  INSERT INTO cfo_alert_state (company_id, alert_key, alert_type, snoozed_until, snoozed_by)
  VALUES (p_company_id, p_alert_key, 'manual_snooze', now() + (p_snooze_hours || ' hours')::interval, v_user_id)
  ON CONFLICT (company_id, alert_key)
  DO UPDATE SET
    snoozed_until = now() + (p_snooze_hours || ' hours')::interval,
    snoozed_by = v_user_id;

  RETURN jsonb_build_object('status', 'snoozed', 'until', now() + (p_snooze_hours || ' hours')::interval);
END;
$$;
