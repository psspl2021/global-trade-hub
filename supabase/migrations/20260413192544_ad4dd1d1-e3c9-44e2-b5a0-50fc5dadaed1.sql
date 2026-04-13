
-- ============================================
-- 1. RACE-SAFE SESSION WITH RETRY + HEARTBEAT + VALIDATION
-- ============================================

CREATE OR REPLACE FUNCTION public.register_session(
  p_user_id UUID,
  p_device_info TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Clean stale sessions (> 24h inactive)
  DELETE FROM user_sessions
  WHERE user_id = p_user_id
    AND active = false
    AND last_seen_at < now() - interval '24 hours';

  -- Deactivate existing active sessions
  UPDATE user_sessions
  SET active = false
  WHERE user_id = p_user_id AND active = true;

  -- Insert new active session (protected by unique index)
  INSERT INTO user_sessions (user_id, device_info, active, last_seen_at)
  VALUES (p_user_id, p_device_info, true, now())
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('allowed', true, 'session_id', v_session_id);

EXCEPTION
  WHEN unique_violation THEN
    -- Race: another login won. Retry.
    UPDATE user_sessions SET active = false WHERE user_id = p_user_id AND active = true;
    INSERT INTO user_sessions (user_id, device_info, active, last_seen_at)
    VALUES (p_user_id, p_device_info, true, now())
    RETURNING id INTO v_session_id;
    RETURN jsonb_build_object('allowed', true, 'session_id', v_session_id, 'race_recovered', true);
END;
$$;

-- Heartbeat function
CREATE OR REPLACE FUNCTION public.update_session_heartbeat(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE user_sessions
  SET last_seen_at = now()
  WHERE user_id = p_user_id AND active = true;
END;
$$;

-- Session validation (used by all critical RPCs)
CREATE OR REPLACE FUNCTION public.validate_active_session(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_sessions
    WHERE user_id = p_user_id
      AND active = true
      AND last_seen_at > now() - interval '30 minutes'
  ) INTO v_valid;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Session expired or invalid — re-authentication required';
  END IF;

  RETURN true;
END;
$$;

-- ============================================
-- 2. PO DUPLICATE PREVENTION (auction-sourced)
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_po_per_auction
ON purchase_orders(requirement_id)
WHERE po_source = 'auction' AND po_status NOT IN ('cancelled');

-- ============================================
-- 3. EMAIL QUEUE (RELIABLE DELIVERY)
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all email queue"
ON public.email_queue FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND business_type = 'admin'
  )
);

CREATE INDEX idx_email_queue_pending ON email_queue(status, scheduled_at)
WHERE status = 'queued';

-- ============================================
-- 4. APPROVAL SYSTEM: REJECTION + CFO + ESCALATION + OVERRIDE
-- ============================================

-- Add CFO and rejection columns
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS cfo_approved_by UUID,
  ADD COLUMN IF NOT EXISTS cfo_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approval_escalated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ceo_override BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ceo_override_by UUID,
  ADD COLUMN IF NOT EXISTS ceo_override_reason TEXT;

-- Enhanced approval RPC with session validation, rejection, CFO, and override
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

    -- Queue rejection email
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

  -- CEO OVERRIDE (bypasses intelligence gate)
  IF p_role = 'ceo' AND p_action = 'override' THEN
    UPDATE purchase_orders SET
      approval_status = 'approved',
      ceo_override = true,
      ceo_override_by = p_user_id,
      ceo_override_reason = p_reason,
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, 'CEO_OVERRIDE', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'reason', p_reason));

    RETURN json_build_object('success', true, 'action', 'ceo_override');
  END IF;

  -- Intelligence gate (skip if CEO override)
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

    -- Queue director notification email
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

    -- Queue CFO notification
    INSERT INTO email_queue(email_type, recipient_email, recipient_name, subject, html_body, metadata)
    SELECT 'po_approval_request', p.email, p.contact_person,
           'PO Awaiting CFO Approval: ' || po.po_number,
           '<p>PO ' || po.po_number || ' has been approved by director and requires CFO sign-off.</p>',
           json_build_object('po_id', p_po_id, 'target_role', 'cfo')::jsonb
    FROM purchase_orders po
    CROSS JOIN profiles p
    WHERE po.id = p_po_id AND p.business_type = 'admin'
    LIMIT 1;

  -- CFO APPROVAL → approved (final)
  ELSIF p_role = 'cfo' AND v_current_status = 'pending_cfo' THEN
    UPDATE purchase_orders SET
      approval_status = 'approved',
      cfo_approved_by = p_user_id,
      cfo_approved_at = now(),
      updated_at = now()
    WHERE id = p_po_id;

    INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
    VALUES (p_po_id, 'CFO_APPROVED_PO', p_user_id, p_idempotency_key,
            json_build_object('from_status', v_current_status, 'to_status', 'approved'));

  ELSE
    RAISE EXCEPTION 'Invalid approval flow: role=% status=%', p_role, v_current_status;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================
-- 5. APPROVAL ESCALATION (Auto-escalate after 24h)
-- ============================================

CREATE OR REPLACE FUNCTION public.escalate_stale_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Manager didn't act in 24h → escalate to director
  UPDATE purchase_orders SET
    approval_status = 'pending_director',
    approval_escalated = true,
    escalated_at = now(),
    updated_at = now()
  WHERE approval_status = 'pending_manager'
    AND updated_at < now() - interval '24 hours'
    AND approval_escalated = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log escalations
  INSERT INTO po_approval_logs(po_id, action, performed_by, idempotency_key, metadata)
  SELECT id, 'AUTO_ESCALATED', '00000000-0000-0000-0000-000000000000'::uuid,
         'escalation_' || id || '_' || now()::text,
         json_build_object('reason', 'Manager approval timeout (24h)')
  FROM purchase_orders
  WHERE approval_escalated = true AND escalated_at = (
    SELECT MAX(escalated_at) FROM purchase_orders WHERE approval_escalated = true
  );

  RETURN v_count;
END;
$$;

-- ============================================
-- 6. ADD SESSION VALIDATION TO proceed_po_step
-- ============================================

-- Get current proceed_po_step definition and add session check
-- We wrap the existing function with session validation
CREATE OR REPLACE FUNCTION public.validate_and_proceed_po(
  p_po_id UUID,
  p_target_status TEXT,
  p_user_id UUID,
  p_idempotency_key TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enforce active session
  PERFORM validate_active_session(p_user_id);

  -- Delegate to existing proceed_po_step
  RETURN proceed_po_step(p_po_id, p_target_status, p_user_id, p_idempotency_key, p_metadata);
END;
$$;
