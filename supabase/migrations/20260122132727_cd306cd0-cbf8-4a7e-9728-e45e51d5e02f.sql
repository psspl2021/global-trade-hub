
-- ===============================
-- 1️⃣ SIGNAL PROMOTION THROTTLE (30-MIN PER SESSION/IP)
-- ===============================

-- Track signal promotions per session to prevent spam / bots
CREATE TABLE IF NOT EXISTS public.signal_promotion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_page_id uuid REFERENCES public.admin_signal_pages(id),
  session_id text,
  ip_address text,
  is_rfq boolean DEFAULT false,
  promoted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_promo_dedupe 
ON public.signal_promotion_logs(signal_page_id, session_id, ip_address, promoted_at);

ALTER TABLE public.signal_promotion_logs ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (for tracking)
CREATE POLICY "Allow signal promotion inserts"
ON public.signal_promotion_logs
FOR INSERT
WITH CHECK (true);

-- Only admins can view logs
CREATE POLICY "Admin only view promotion logs"
ON public.signal_promotion_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND business_type = 'admin'
  )
);

-- Safe promote function (only once per 30 min per session/ip)
CREATE OR REPLACE FUNCTION public.safe_promote_signal(
  p_signal_page_id uuid,
  p_session_id text,
  p_ip text,
  p_is_rfq boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_hit boolean;
BEGIN
  SELECT true INTO recent_hit
  FROM public.signal_promotion_logs
  WHERE signal_page_id = p_signal_page_id
    AND (session_id = p_session_id OR ip_address = p_ip)
    AND promoted_at > now() - interval '30 minutes'
  LIMIT 1;

  IF recent_hit THEN
    RETURN; -- ignore repeated hit
  END IF;

  -- Promote signal page safely
  UPDATE public.admin_signal_pages
  SET 
    intent_score = COALESCE(intent_score, 0) + 1,
    rfqs_submitted = COALESCE(rfqs_submitted, 0) + CASE WHEN p_is_rfq THEN 1 ELSE 0 END,
    views = COALESCE(views, 0) + CASE WHEN NOT p_is_rfq THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = p_signal_page_id;

  INSERT INTO public.signal_promotion_logs(signal_page_id, session_id, ip_address, is_rfq)
  VALUES (p_signal_page_id, p_session_id, p_ip, p_is_rfq);
END;
$$;

-- ===============================
-- 2️⃣ SUPPLIER SHORTLIST TABLE + ADMIN-ONLY RLS
-- ===============================

CREATE TABLE IF NOT EXISTS public.supplier_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid REFERENCES public.demand_intelligence_signals(id),
  requirement_id uuid REFERENCES public.requirements(id),
  supplier_id uuid NOT NULL,
  match_score numeric,
  shortlisted_by uuid,
  shortlisted_at timestamptz DEFAULT now(),
  contacted boolean DEFAULT false,
  contacted_at timestamptz,
  notes text
);

ALTER TABLE public.supplier_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only shortlist access"
ON public.supplier_shortlists
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND business_type = 'admin'
  )
);

-- ===============================
-- 3️⃣ AUTO-FLAG HOT SIGNALS (DEMAND INTELLIGENCE)
-- ===============================

CREATE OR REPLACE FUNCTION public.auto_flag_hot_signals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Auto-escalate to pending_activation when hot
  IF (NEW.intent_score >= 8 OR NEW.overall_score >= 0.8)
     AND NEW.lane_state = 'active' 
     AND NEW.decision_action IS NULL THEN
    NEW.lane_state := 'pending_activation';
    NEW.priority := 'high';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_flag_hot_signals_trigger ON public.demand_intelligence_signals;

CREATE TRIGGER auto_flag_hot_signals_trigger
BEFORE UPDATE ON public.demand_intelligence_signals
FOR EACH ROW
EXECUTE FUNCTION public.auto_flag_hot_signals();

-- ===============================
-- 4️⃣ COMMISSION LOCK ON AWARD (CRITICAL)
-- ===============================

-- Add locked commission fields (skip if exists)
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS awarded_commission_pct numeric,
ADD COLUMN IF NOT EXISTS awarded_commission_value numeric;

-- Freeze commission on award
CREATE OR REPLACE FUNCTION public.lock_commission_on_award()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  commission_pct numeric := 2.5; -- default platform commission
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    NEW.awarded_commission_pct := commission_pct;
    NEW.awarded_commission_value := (NEW.bid_amount * commission_pct) / 100;
    NEW.awarded_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_commission_trigger ON public.bids;

CREATE TRIGGER lock_commission_trigger
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.lock_commission_on_award();

-- ===============================
-- 5️⃣ CONTROLLED IDENTITY REVEAL (ENTERPRISE MODE)
-- ===============================

-- Track identity reveals with full audit
CREATE TABLE IF NOT EXISTS public.identity_reveal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid REFERENCES public.requirements(id),
  revealed_by uuid,
  revealed_at timestamptz DEFAULT now(),
  reveal_reason text,
  metadata jsonb
);

ALTER TABLE public.identity_reveal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only reveal access"
ON public.identity_reveal_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND business_type = 'admin'
  )
);

-- Flag to unlock identities on requirements
ALTER TABLE public.requirements
ADD COLUMN IF NOT EXISTS identity_revealed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS identity_revealed_at timestamptz,
ADD COLUMN IF NOT EXISTS identity_revealed_by uuid;

-- Admin-only reveal function with audit trail
CREATE OR REPLACE FUNCTION public.reveal_identities(
  p_req_id uuid,
  p_reason text DEFAULT 'PO signed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND business_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reveal identities';
  END IF;

  UPDATE public.requirements
  SET 
    identity_revealed = true,
    identity_revealed_at = now(),
    identity_revealed_by = auth.uid()
  WHERE id = p_req_id;

  INSERT INTO public.identity_reveal_events(requirement_id, revealed_by, reveal_reason)
  VALUES (p_req_id, auth.uid(), p_reason);
END;
$$;
