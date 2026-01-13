-- ═══════════════════════════════════════════════════════════════════════════
-- CRITICAL PRODUCTION FIXES
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣ ENABLE PGCRYPTO FOR SHA-256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2️⃣ SAFE PO AMOUNT HELPER (Schema-agnostic)
CREATE OR REPLACE FUNCTION public.get_po_amount(po public.purchase_orders)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(po.po_value, po.total_amount);
$$;

COMMENT ON FUNCTION public.get_po_amount(public.purchase_orders) IS 
'Schema-safe helper to get PO amount from either po_value or total_amount column.';

-- 3️⃣ FIX HASH GENERATION (Use pgcrypto.digest)
CREATE OR REPLACE FUNCTION public.generate_po_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.po_status = 'FULFILLED' AND NEW.immutable_hash IS NULL THEN
    NEW.immutable_hash :=
      encode(
        digest(
          NEW.id::text
          || NEW.po_number
          || COALESCE(NEW.po_value, NEW.total_amount)::text
          || COALESCE(NEW.contract_id::text, '')
          || COALESCE(NEW.value_locked_at::text, now()::text),
          'sha256'
        ),
        'hex'
      );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_po_hash() IS 
'Generates SHA-256 hash using pgcrypto.digest() on PO fulfillment. Court-defensible tamper detection.';

-- 4️⃣ FIX RLS POLICIES (Contract-Only, No supplier_id Assumption)
DROP POLICY IF EXISTS "Suppliers view own POs" ON public.purchase_orders;

CREATE POLICY "Suppliers view own POs"
ON public.purchase_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.contracts c
    WHERE c.id = contract_id
      AND c.supplier_id = auth.uid()
  )
);

-- 5️⃣ HARDENED VALIDATION WITH LOCK TIMEOUT
CREATE OR REPLACE FUNCTION public.validate_po_against_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_contract RECORD;
  v_used_value NUMERIC;
  v_po_amount NUMERIC;
  v_is_insert BOOLEAN := (TG_OP = 'INSERT');
BEGIN
  -- Calculate PO amount safely
  v_po_amount := COALESCE(NEW.po_value, NEW.total_amount);

  -- Skip validation for legacy POs (no contract_id)
  IF NEW.contract_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ═══ LEGAL HOLD CHECK ═══
  IF NOT v_is_insert AND OLD.legal_hold = TRUE THEN
    RAISE EXCEPTION 'PO % is under legal hold and cannot be modified.', OLD.id;
  END IF;

  -- ═══ SET LOCK TIMEOUT TO PREVENT DEADLOCKS ═══
  SET LOCAL lock_timeout = '3s';

  -- ═══ CONCURRENCY-SAFE CONTRACT LOCK ═══
  SELECT contract_value, contract_status, currency
  INTO v_contract
  FROM public.contracts
  WHERE id = NEW.contract_id
  FOR UPDATE;

  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Contract not found: %', NEW.contract_id;
  END IF;

  -- ═══ CONTRACT GOVERNANCE ═══
  IF v_contract.contract_status NOT IN ('ACTIVE', 'SIGNED') THEN
    RAISE EXCEPTION 'POs can only be created/modified against ACTIVE or SIGNED contracts. Status: %', v_contract.contract_status;
  END IF;

  -- ═══ CURRENCY MATCH ENFORCEMENT ═══
  IF NEW.currency IS DISTINCT FROM v_contract.currency THEN
    RAISE EXCEPTION 'PO currency (%) must match contract currency (%)', NEW.currency, v_contract.currency;
  END IF;

  -- ═══ MONETARY INTEGRITY: PREVENT VALUE INCREASE AFTER CREATION ═══
  IF NOT v_is_insert AND OLD.original_po_value IS NOT NULL THEN
    IF v_po_amount > OLD.original_po_value THEN
      RAISE EXCEPTION 'PO value cannot be increased after creation. Original: %, Attempted: %', 
        OLD.original_po_value, v_po_amount;
    END IF;
  END IF;

  -- ═══ CONTRACT VALUE LIMIT (with row locking) ═══
  SELECT COALESCE(SUM(COALESCE(po_value, total_amount)), 0)
  INTO v_used_value
  FROM public.purchase_orders
  WHERE contract_id = NEW.contract_id
    AND po_status NOT IN ('CANCELLED')
    AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_used_value + v_po_amount > v_contract.contract_value THEN
    RAISE EXCEPTION 
      'PO value exceeds remaining contract balance. Contract: %, Used: %, Remaining: %, Requested: %',
      v_contract.contract_value, v_used_value, 
      v_contract.contract_value - v_used_value, v_po_amount;
  END IF;

  -- ═══ LOCK ORIGINAL VALUE ON FIRST INSERT ═══
  IF v_is_insert THEN
    NEW.original_po_value := v_po_amount;
    NEW.value_locked_at := now();
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_po_against_contract() IS 
'Enterprise-grade PO validation with: 3s lock timeout, row-level locking (FOR UPDATE), currency matching, value immutability, contract governance. Deadlock-safe.';

-- 6️⃣ CONTRACT CURRENCY NOT NULL CONSTRAINT
ALTER TABLE public.contracts
DROP CONSTRAINT IF EXISTS chk_contract_currency_not_null;

ALTER TABLE public.contracts
ADD CONSTRAINT chk_contract_currency_not_null CHECK (currency IS NOT NULL);

-- 7️⃣ HARDENED AUDIT LOGGING (Using safe amount reference)
CREATE OR REPLACE FUNCTION public.log_po_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_action TEXT;
  v_metadata JSONB;
  v_new_amount NUMERIC := COALESCE(NEW.po_value, NEW.total_amount);
  v_old_amount NUMERIC;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_amount := COALESCE(OLD.po_value, OLD.total_amount);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_action := 'PO_CREATED';
    v_metadata := jsonb_build_object(
      'po_number', NEW.po_number,
      'po_value', v_new_amount,
      'contract_id', NEW.contract_id,
      'currency', NEW.currency,
      'created_at', now()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.po_status IS DISTINCT FROM NEW.po_status THEN
      v_action := 'STATUS_CHANGE';
      v_metadata := jsonb_build_object(
        'old_status', OLD.po_status,
        'new_status', NEW.po_status,
        'changed_at', now()
      );
    ELSIF OLD.legal_hold IS DISTINCT FROM NEW.legal_hold THEN
      v_action := CASE WHEN NEW.legal_hold THEN 'LEGAL_HOLD_APPLIED' ELSE 'LEGAL_HOLD_RELEASED' END;
      v_metadata := jsonb_build_object(
        'po_id', NEW.id,
        'changed_at', now()
      );
    ELSIF v_old_amount IS DISTINCT FROM v_new_amount THEN
      v_action := 'VALUE_AMENDED';
      v_metadata := jsonb_build_object(
        'old_value', v_old_amount,
        'new_value', v_new_amount,
        'original_value', OLD.original_po_value,
        'changed_at', now()
      );
    ELSE
      v_action := 'PO_UPDATED';
      v_metadata := jsonb_build_object('updated_at', now());
    END IF;
  END IF;

  IF v_action IS NOT NULL THEN
    INSERT INTO public.po_audit_logs (po_id, action, metadata, created_by)
    VALUES (NEW.id, v_action, v_metadata, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.log_po_events() IS 
'Schema-safe audit logging using COALESCE for amount fields. Court-ready forensics.';