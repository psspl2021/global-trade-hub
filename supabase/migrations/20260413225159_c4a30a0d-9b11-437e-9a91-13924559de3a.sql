
-- ============================================
-- 1. FIX: Add auction_id to purchase_orders
-- ============================================
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS auction_id UUID REFERENCES reverse_auctions(id);

-- Drop wrong index and create correct one
DROP INDEX IF EXISTS idx_unique_po_per_auction;

CREATE UNIQUE INDEX idx_unique_po_per_auction
ON purchase_orders(auction_id)
WHERE po_source = 'auction' AND po_status NOT IN ('cancelled');

-- ============================================
-- 2. FINANCIAL CONTROL LAYER
-- ============================================
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS budget_cap NUMERIC,
  ADD COLUMN IF NOT EXISTS spend_category TEXT;

-- Finance audit log
CREATE TABLE IF NOT EXISTS public.po_finance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id),
  action TEXT NOT NULL,
  amount NUMERIC,
  payment_reference TEXT,
  performed_by UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.po_finance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view finance logs"
ON public.po_finance_logs FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND business_type = 'admin')
);

CREATE INDEX idx_po_finance_logs_po ON po_finance_logs(po_id);

-- ============================================
-- 3. FIX ESCALATION (use RETURNING properly)
-- ============================================
CREATE OR REPLACE FUNCTION public.escalate_stale_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_po RECORD;
BEGIN
  FOR v_po IN
    UPDATE purchase_orders SET
      approval_status = 'pending_director',
      approval_escalated = true,
      escalated_at = now(),
      updated_at = now()
    WHERE approval_status = 'pending_manager'
      AND updated_at < now() - interval '24 hours'
      AND approval_escalated = false
    RETURNING id
  LOOP
    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (v_po.id, 'AUTO_ESCALATED', '00000000-0000-0000-0000-000000000000'::uuid,
            'escalation_' || v_po.id || '_' || extract(epoch from now())::text,
            json_build_object('reason', 'Manager approval timeout (24h)'));
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================
-- 4. FIX CEO OVERRIDE (reason mandatory)
-- ============================================
CREATE OR REPLACE FUNCTION public.approve_po_step(
  p_po_id UUID,
  p_role TEXT,
  p_user_id UUID,
  p_idempotency_key TEXT,
  p_action TEXT DEFAULT 'approve',
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_status TEXT;
  v_quality NUMERIC;
  v_savings NUMERIC;
  v_existing BOOLEAN;
BEGIN
  -- Session validation
  PERFORM validate_active_session(p_user_id);

  -- Idempotency check
  SELECT EXISTS(
    SELECT 1 FROM po_approval_logs WHERE idempotency_key = p_idempotency_key
  ) INTO v_existing;

  IF v_existing THEN
    RETURN json_build_object('success', true, 'idempotent', true);
  END IF;

  -- Lock PO row
  SELECT approval_status, auction_quality_score, price_drop_pct
    INTO v_current_status, v_quality, v_savings
    FROM purchase_orders
    WHERE id = p_po_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PO not found';
  END IF;

  -- REJECTION FLOW
  IF p_action = 'reject' THEN
    IF p_reason IS NULL OR p_reason = '' THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;

    UPDATE purchase_orders SET
      approval_status = 'rejected',
      rejected_by = p_user_id,
      rejected_at = now(),
      rejection_reason = p_reason,
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, upper(p_role) || '_REJECTED_PO', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'reason', p_reason));

    INSERT INTO email_queue(email_type, recipient_email, recipient_name, subject, html_body, metadata)
    SELECT 'po_rejected', p.email, p.contact_person,
           'PO Rejected: ' || po.po_number,
           '<p>PO ' || po.po_number || ' has been rejected by ' || p_role || '.</p><p>Reason: ' || p_reason || '</p>',
           json_build_object('po_id', p_po_id, 'role', p_role)::jsonb
    FROM purchase_orders po
    CROSS JOIN profiles p
    WHERE po.id = p_po_id AND p.id = po.created_by;

    RETURN json_build_object('success', true, 'action', 'rejected');
  END IF;

  -- CEO OVERRIDE (reason MANDATORY)
  IF p_role = 'ceo' AND p_action = 'override' THEN
    IF p_reason IS NULL OR p_reason = '' THEN
      RAISE EXCEPTION 'CEO override requires a written justification';
    END IF;

    UPDATE purchase_orders SET
      approval_status = 'approved',
      ceo_override = true,
      ceo_override_by = p_user_id,
      ceo_override_reason = p_reason,
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, 'CEO_OVERRIDE', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'reason', p_reason,
                              'override_flag', true));

    RETURN json_build_object('success', true, 'action', 'ceo_override');
  END IF;

  -- Intelligence gate
  IF v_quality IS NOT NULL AND v_quality < 40 THEN
    RAISE EXCEPTION 'Blocked: Low competition auction (score: %)', v_quality;
  END IF;

  IF v_savings IS NOT NULL AND v_savings < 2 THEN
    RAISE EXCEPTION 'Blocked: Savings below threshold (%)', v_savings;
  END IF;

  -- MANAGER APPROVAL
  IF p_role = 'manager' AND v_current_status = 'pending_manager' THEN
    UPDATE purchase_orders SET
      approval_status = 'pending_director',
      manager_approved_by = p_user_id,
      manager_approved_at = now(),
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, 'MANAGER_APPROVED_PO', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'to_status', 'pending_director'));

    INSERT INTO email_queue(email_type, recipient_email, recipient_name, subject, html_body, metadata)
    SELECT 'po_approval_request', p.email, p.contact_person,
           'PO Awaiting Your Approval: ' || po.po_number,
           '<p>PO ' || po.po_number || ' has been approved by manager and requires your director approval.</p>',
           json_build_object('po_id', p_po_id, 'target_role', 'director')::jsonb
    FROM purchase_orders po
    CROSS JOIN profiles p
    WHERE po.id = p_po_id AND p.business_type = 'admin'
    LIMIT 1;

  -- DIRECTOR APPROVAL → pending_cfo
  ELSIF p_role = 'director' AND v_current_status = 'pending_director' THEN
    UPDATE purchase_orders SET
      approval_status = 'pending_cfo',
      director_approved_by = p_user_id,
      director_approved_at = now(),
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, 'DIRECTOR_APPROVED_PO', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'to_status', 'pending_cfo'));

    INSERT INTO email_queue(email_type, recipient_email, recipient_name, subject, html_body, metadata)
    SELECT 'po_approval_request', p.email, p.contact_person,
           'PO Awaiting CFO Approval: ' || po.po_number,
           '<p>PO ' || po.po_number || ' has been approved by director and requires CFO sign-off.</p>',
           json_build_object('po_id', p_po_id, 'target_role', 'cfo')::jsonb
    FROM purchase_orders po
    CROSS JOIN profiles p
    WHERE po.id = p_po_id AND p.business_type = 'admin'
    LIMIT 1;

  -- CFO APPROVAL → approved (final, with budget validation)
  ELSIF p_role = 'cfo' AND v_current_status = 'pending_cfo' THEN
    -- Budget cap enforcement
    IF (SELECT budget_cap FROM purchase_orders WHERE id = p_po_id) IS NOT NULL
       AND (SELECT total_amount FROM purchase_orders WHERE id = p_po_id) >
           (SELECT budget_cap FROM purchase_orders WHERE id = p_po_id) THEN
      RAISE EXCEPTION 'PO total exceeds budget cap';
    END IF;

    UPDATE purchase_orders SET
      approval_status = 'approved',
      cfo_approved_by = p_user_id,
      cfo_approved_at = now(),
      payment_status = 'pending_payment',
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, 'CFO_APPROVED_PO', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'to_status', 'approved'));

    -- Log finance event
    INSERT INTO po_finance_logs(po_id, action, amount, performed_by, metadata)
    SELECT p_po_id, 'PAYMENT_AUTHORIZED', total_amount, p_user_id,
           json_build_object('approval_chain', 'manager→director→cfo')::jsonb
    FROM purchase_orders WHERE id = p_po_id;

  ELSE
    RAISE EXCEPTION 'Invalid approval flow: role=% status=%', p_role, v_current_status;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================
-- 5. DEAD SESSION CLEANUP
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_dead_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET active = false
  WHERE active = true
    AND last_seen_at < now() - interval '30 minutes';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================
-- 6. PAYMENT FLOW RPC (CFO approved → payment)
-- ============================================
CREATE OR REPLACE FUNCTION public.record_po_payment(
  p_po_id UUID,
  p_user_id UUID,
  p_payment_reference TEXT,
  p_amount NUMERIC,
  p_idempotency_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status TEXT;
  v_payment_status TEXT;
  v_existing BOOLEAN;
BEGIN
  PERFORM validate_active_session(p_user_id);

  -- Idempotency
  SELECT EXISTS(
    SELECT 1 FROM po_finance_logs WHERE metadata->>'idempotency_key' = p_idempotency_key
  ) INTO v_existing;
  IF v_existing THEN
    RETURN json_build_object('success', true, 'idempotent', true);
  END IF;

  SELECT approval_status, payment_status
    INTO v_status, v_payment_status
    FROM purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF v_status != 'approved' THEN
    RAISE EXCEPTION 'PO must be approved before payment (current: %)', v_status;
  END IF;

  IF v_payment_status = 'paid' THEN
    RAISE EXCEPTION 'PO already paid';
  END IF;

  UPDATE purchase_orders SET
    payment_status = 'paid',
    payment_reference = p_payment_reference,
    payment_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_po_id;

  INSERT INTO po_finance_logs(po_id, action, amount, payment_reference, performed_by, metadata)
  VALUES (p_po_id, 'PAYMENT_CONFIRMED', p_amount, p_payment_reference, p_user_id,
          json_build_object('idempotency_key', p_idempotency_key));

  RETURN json_build_object('success', true, 'payment_status', 'paid');
END;
$$;
