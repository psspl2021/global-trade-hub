
-- ============================================================
-- GLOBAL PROCUREMENT PLAN — SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.global_plan_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_company_id UUID NULL,
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'cashfree', 'wire')),
  currency TEXT NOT NULL DEFAULT 'INR',
  amount_paid NUMERIC(14,2) NOT NULL,
  amount_inr_equivalent NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled', 'past_due', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  -- Stripe-specific
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  -- Cashfree / Wire
  cashfree_order_id TEXT UNIQUE,
  wire_intent_id UUID,
  activated_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gps_user ON public.global_plan_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_status ON public.global_plan_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gps_period_end ON public.global_plan_subscriptions(current_period_end);

ALTER TABLE public.global_plan_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.global_plan_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
  ON public.global_plan_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins view all subscriptions"
  ON public.global_plan_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- WIRE PAYMENT INTENTS (manual reconciliation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wire_payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_email TEXT,
  buyer_company TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  amount_inr_equivalent NUMERIC(14,2),
  reference_number TEXT,
  proof_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected', 'reconciled')),
  reconciled_by UUID REFERENCES auth.users(id),
  reconciled_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wire_user ON public.wire_payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_wire_status ON public.wire_payment_intents(status);

ALTER TABLE public.wire_payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wire intents"
  ON public.wire_payment_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own wire intents"
  ON public.wire_payment_intents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all wire intents"
  ON public.wire_payment_intents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages wire intents"
  ON public.wire_payment_intents FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- ADMIN ALERTS (activations, cancellations, wire received)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('activation', 'cancellation', 'wire_received', 'renewal_failed', 'past_due')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.global_plan_subscriptions(id) ON DELETE CASCADE,
  wire_intent_id UUID REFERENCES public.wire_payment_intents(id) ON DELETE CASCADE,
  payload JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_by UUID REFERENCES auth.users(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_unread ON public.subscription_admin_alerts(is_read, created_at DESC);

ALTER TABLE public.subscription_admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alerts"
  ON public.subscription_admin_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts alerts"
  ON public.subscription_admin_alerts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- TIMESTAMP TRIGGERS
-- ============================================================
CREATE TRIGGER update_gps_updated_at
  BEFORE UPDATE ON public.global_plan_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wire_updated_at
  BEFORE UPDATE ON public.wire_payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- HELPER: check if user has active global plan
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_active_global_plan(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.global_plan_subscriptions
    WHERE user_id = _user_id
      AND status IN ('active', 'past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;
