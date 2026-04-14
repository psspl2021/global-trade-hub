
-- STEP 1: FX NORMALIZATION
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS base_currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS po_value_base_currency numeric;

CREATE OR REPLACE FUNCTION public.compute_po_base_currency_value()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.exchange_rate IS NOT NULL AND NEW.exchange_rate > 0 THEN
    NEW.po_value_base_currency := ROUND(NEW.po_value / NEW.exchange_rate, 2);
  ELSE
    NEW.po_value_base_currency := NEW.po_value;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_po_base_value ON public.purchase_orders;
CREATE TRIGGER trg_compute_po_base_value
  BEFORE INSERT OR UPDATE OF po_value, exchange_rate, base_currency
  ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_po_base_currency_value();

-- STEP 2: PAYMENT LIFECYCLE
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS payment_workflow_status text DEFAULT 'pending';

-- Use validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_payment_workflow_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.payment_workflow_status NOT IN ('pending', 'approved_for_payment', 'payment_initiated', 'payment_confirmed', 'payment_failed') THEN
    RAISE EXCEPTION 'Invalid payment_workflow_status: %', NEW.payment_workflow_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_payment_workflow ON public.purchase_orders;
CREATE TRIGGER trg_validate_payment_workflow
  BEFORE INSERT OR UPDATE OF payment_workflow_status ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_workflow_status();

CREATE TABLE IF NOT EXISTS public.po_payment_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  performed_by uuid,
  payment_reference text,
  payment_method text,
  amount numeric,
  currency text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.po_payment_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment audit logs"
  ON public.po_payment_audit_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "PO creator can view payment audit logs"
  ON public.po_payment_audit_logs FOR SELECT TO authenticated
  USING (po_id IN (SELECT id FROM public.purchase_orders WHERE created_by = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_po_payment_audit_po_id ON public.po_payment_audit_logs(po_id);

-- Payment state machine RPC
CREATE OR REPLACE FUNCTION public.transition_po_payment(
  p_po_id uuid, p_target_status text, p_user_id uuid,
  p_payment_reference text DEFAULT NULL, p_payment_method text DEFAULT NULL,
  p_amount numeric DEFAULT NULL, p_currency text DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current_status text; v_approval_status text;
BEGIN
  SELECT payment_workflow_status, approval_status INTO v_current_status, v_approval_status
    FROM purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PO not found'; END IF;

  IF p_target_status = 'approved_for_payment' AND v_approval_status != 'approved' THEN
    RAISE EXCEPTION 'PO must be fully approved before initiating payment';
  END IF;
  IF p_target_status = 'payment_initiated' AND v_current_status != 'approved_for_payment' THEN
    RAISE EXCEPTION 'Must be approved_for_payment first';
  END IF;
  IF p_target_status = 'payment_confirmed' AND v_current_status != 'payment_initiated' THEN
    RAISE EXCEPTION 'Payment must be initiated first';
  END IF;
  IF p_target_status = 'payment_failed' AND v_current_status NOT IN ('payment_initiated', 'approved_for_payment') THEN
    RAISE EXCEPTION 'Can only fail from initiated or approved_for_payment';
  END IF;

  UPDATE purchase_orders SET payment_workflow_status = p_target_status, updated_at = now() WHERE id = p_po_id;

  INSERT INTO po_payment_audit_logs (po_id, from_status, to_status, performed_by, payment_reference, payment_method, amount, currency, notes)
  VALUES (p_po_id, v_current_status, p_target_status, p_user_id, p_payment_reference, p_payment_method, p_amount, p_currency, p_notes);

  RETURN jsonb_build_object('success', true, 'from', v_current_status, 'to', p_target_status);
END;
$$;

-- STEP 3: SUPPLIER COMPLIANCE
CREATE TABLE IF NOT EXISTS public.supplier_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id text NOT NULL,
  buyer_id uuid,
  country_code text NOT NULL,
  compliance_status text NOT NULL DEFAULT 'pending',
  risk_level text DEFAULT 'low',
  export_license_verified boolean DEFAULT false,
  import_license_verified boolean DEFAULT false,
  trade_restriction_check boolean DEFAULT false,
  blacklist_screened boolean DEFAULT false,
  blacklist_screened_at timestamptz,
  compliance_notes text,
  compliance_expires_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on supplier_compliance"
  ON public.supplier_compliance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Buyers can view own supplier compliance"
  ON public.supplier_compliance FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_supplier_compliance_supplier ON public.supplier_compliance(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_compliance_status ON public.supplier_compliance(compliance_status);

-- Validation triggers for supplier_compliance
CREATE OR REPLACE FUNCTION public.validate_supplier_compliance()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.compliance_status NOT IN ('pending', 'verified', 'flagged', 'blacklisted', 'expired') THEN
    RAISE EXCEPTION 'Invalid compliance_status: %', NEW.compliance_status;
  END IF;
  IF NEW.risk_level NOT IN ('low', 'medium', 'high', 'critical') THEN
    RAISE EXCEPTION 'Invalid risk_level: %', NEW.risk_level;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_supplier_compliance
  BEFORE INSERT OR UPDATE ON public.supplier_compliance
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_supplier_compliance();

-- Compliance gate function
CREATE OR REPLACE FUNCTION public.check_supplier_compliance(p_supplier_id text, p_region_type text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_region_type != 'global' THEN RETURN true; END IF;
  RETURN EXISTS (
    SELECT 1 FROM supplier_compliance
    WHERE supplier_id = p_supplier_id AND compliance_status = 'verified'
      AND (compliance_expires_at IS NULL OR compliance_expires_at > now())
  );
END;
$$;

-- STEP 4: INCOTERMS ENFORCEMENT
CREATE OR REPLACE FUNCTION public.enforce_global_incoterms()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.region_type = 'global' AND (NEW.incoterms IS NULL OR NEW.incoterms = '') THEN
    RAISE EXCEPTION 'Incoterms are mandatory for global purchase orders';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_global_incoterms ON public.purchase_orders;
CREATE TRIGGER trg_enforce_global_incoterms
  BEFORE INSERT OR UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_global_incoterms();

-- STEP 5: EMAIL LOCALE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_locale text DEFAULT 'en';
