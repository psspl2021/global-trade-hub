-- ═══════════════════════════════════════════════════════════════════════════
-- ENTERPRISE ERP-GRADE PO HARDENING (SAP/Oracle/Coupa Standard)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣ ADD ENTERPRISE COLUMNS
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS immutable_hash TEXT,
ADD COLUMN IF NOT EXISTS original_po_value NUMERIC,
ADD COLUMN IF NOT EXISTS value_locked_at TIMESTAMP WITH TIME ZONE;

-- 2️⃣ MONETARY INTEGRITY CONSTRAINT (contract-linked POs only)
ALTER TABLE public.purchase_orders
DROP CONSTRAINT IF EXISTS chk_po_value_positive;

ALTER TABLE public.purchase_orders
ADD CONSTRAINT chk_po_value_positive CHECK (
  contract_id IS NULL OR po_value > 0
);

-- 3️⃣ PERFORMANCE INDEXES (partial for contract-linked POs)
CREATE INDEX IF NOT EXISTS idx_po_contract_active 
ON public.purchase_orders(contract_id) 
WHERE contract_id IS NOT NULL AND po_status NOT IN ('FULFILLED', 'CANCELLED');

CREATE INDEX IF NOT EXISTS idx_po_legal_hold 
ON public.purchase_orders(id) 
WHERE legal_hold = TRUE;

-- 4️⃣ ENTERPRISE-GRADE PO VALIDATION WITH ROW LOCKING
CREATE OR REPLACE FUNCTION public.validate_po_against_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_contract RECORD;
  v_used_value NUMERIC;
  v_is_insert BOOLEAN := (TG_OP = 'INSERT');
BEGIN
  -- Skip validation for legacy POs (no contract_id)
  IF NEW.contract_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ═══ LEGAL HOLD CHECK ═══
  IF NOT v_is_insert AND OLD.legal_hold = TRUE THEN
    RAISE EXCEPTION 'PO % is under legal hold and cannot be modified.', OLD.id;
  END IF;

  -- ═══ CONCURRENCY-SAFE CONTRACT LOCK ═══
  -- SELECT FOR UPDATE prevents race conditions under parallel transactions
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
    IF COALESCE(NEW.po_value, NEW.total_amount) > OLD.original_po_value THEN
      RAISE EXCEPTION 'PO value cannot be increased after creation. Original: %, Attempted: %', 
        OLD.original_po_value, COALESCE(NEW.po_value, NEW.total_amount);
    END IF;
  END IF;

  -- ═══ CONTRACT VALUE LIMIT (with row locking) ═══
  SELECT COALESCE(SUM(COALESCE(po_value, total_amount)), 0)
  INTO v_used_value
  FROM public.purchase_orders
  WHERE contract_id = NEW.contract_id
    AND po_status NOT IN ('CANCELLED')
    AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_used_value + COALESCE(NEW.po_value, NEW.total_amount) > v_contract.contract_value THEN
    RAISE EXCEPTION 
      'PO value exceeds remaining contract balance. Contract: %, Used: %, Remaining: %, Requested: %',
      v_contract.contract_value, v_used_value, 
      v_contract.contract_value - v_used_value, 
      COALESCE(NEW.po_value, NEW.total_amount);
  END IF;

  -- ═══ LOCK ORIGINAL VALUE ON FIRST INSERT ═══
  IF v_is_insert THEN
    NEW.original_po_value := COALESCE(NEW.po_value, NEW.total_amount);
    NEW.value_locked_at := now();
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_po_against_contract() IS 
'Enterprise-grade PO validation with: row-level locking (FOR UPDATE), currency matching, value immutability, contract governance. Concurrency-safe under parallel transactions.';

-- Recreate trigger with proper columns
DROP TRIGGER IF EXISTS trg_validate_po ON public.purchase_orders;
CREATE TRIGGER trg_validate_po
BEFORE INSERT OR UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_po_against_contract();

-- 5️⃣ PO LIFECYCLE STATE MACHINE
CREATE OR REPLACE FUNCTION public.enforce_po_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_valid_transitions JSONB := '{
    "CREATED": ["SENT", "CANCELLED"],
    "SENT": ["ACKNOWLEDGED", "CANCELLED"],
    "ACKNOWLEDGED": ["PARTIALLY_FULFILLED", "FULFILLED"],
    "PARTIALLY_FULFILLED": ["FULFILLED"],
    "FULFILLED": [],
    "CANCELLED": []
  }'::jsonb;
  v_allowed_next TEXT[];
BEGIN
  -- Skip if po_status not changed or not set
  IF OLD.po_status IS NOT DISTINCT FROM NEW.po_status THEN
    RETURN NEW;
  END IF;

  IF OLD.po_status IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get allowed transitions
  SELECT ARRAY(SELECT jsonb_array_elements_text(v_valid_transitions->OLD.po_status))
  INTO v_allowed_next;

  -- Validate transition
  IF NEW.po_status IS NOT NULL AND NOT (NEW.po_status = ANY(v_allowed_next)) THEN
    RAISE EXCEPTION 'Invalid PO status transition: % → %. Allowed: %', 
      OLD.po_status, NEW.po_status, array_to_string(v_allowed_next, ', ');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_po_lifecycle ON public.purchase_orders;
CREATE TRIGGER trg_po_lifecycle
BEFORE UPDATE OF po_status ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_po_lifecycle();

COMMENT ON FUNCTION public.enforce_po_lifecycle() IS 
'Enforces valid PO state machine: CREATED→SENT→ACKNOWLEDGED→PARTIALLY_FULFILLED→FULFILLED. Cancellation only from CREATED/SENT.';

-- 6️⃣ ENHANCED IMMUTABILITY (FULFILLED, CANCELLED, LEGAL HOLD)
CREATE OR REPLACE FUNCTION public.prevent_fulfilled_po_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Legal hold blocks ALL modifications
  IF OLD.legal_hold = TRUE THEN
    RAISE EXCEPTION 'PO % is under legal hold. No modifications allowed.', OLD.id;
  END IF;

  -- Finalized status blocks modifications (except legal_hold toggle by admin)
  IF OLD.po_status IN ('FULFILLED', 'CANCELLED') THEN
    -- Allow only legal_hold toggle
    IF (NEW.legal_hold IS DISTINCT FROM OLD.legal_hold) AND 
       (NEW.po_status IS NOT DISTINCT FROM OLD.po_status) AND
       (NEW.po_value IS NOT DISTINCT FROM OLD.po_value) THEN
      RETURN NEW;
    END IF;
    
    RAISE EXCEPTION 'PO % is finalized (%) and cannot be modified.', OLD.id, OLD.po_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_final_po ON public.purchase_orders;
CREATE TRIGGER trg_lock_final_po
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_fulfilled_po_edit();

COMMENT ON FUNCTION public.prevent_fulfilled_po_edit() IS 
'Prevents edits to FULFILLED/CANCELLED POs and legal_hold POs. Only legal_hold toggle allowed on finalized POs.';

-- 7️⃣ COMPREHENSIVE AUDIT LOGGING
CREATE OR REPLACE FUNCTION public.log_po_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_action TEXT;
  v_metadata JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'PO_CREATED';
    v_metadata := jsonb_build_object(
      'po_number', NEW.po_number,
      'po_value', COALESCE(NEW.po_value, NEW.total_amount),
      'contract_id', NEW.contract_id,
      'currency', NEW.currency,
      'created_at', now()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.po_status IS DISTINCT FROM NEW.po_status THEN
      v_action := 'STATUS_CHANGE';
      v_metadata := jsonb_build_object(
        'old_status', OLD.po_status,
        'new_status', NEW.po_status,
        'changed_at', now()
      );
    -- Legal hold change
    ELSIF OLD.legal_hold IS DISTINCT FROM NEW.legal_hold THEN
      v_action := CASE WHEN NEW.legal_hold THEN 'LEGAL_HOLD_APPLIED' ELSE 'LEGAL_HOLD_RELEASED' END;
      v_metadata := jsonb_build_object(
        'po_id', NEW.id,
        'changed_at', now()
      );
    -- Value change (reduction only, since increase is blocked)
    ELSIF COALESCE(OLD.po_value, OLD.total_amount) IS DISTINCT FROM COALESCE(NEW.po_value, NEW.total_amount) THEN
      v_action := 'VALUE_AMENDED';
      v_metadata := jsonb_build_object(
        'old_value', COALESCE(OLD.po_value, OLD.total_amount),
        'new_value', COALESCE(NEW.po_value, NEW.total_amount),
        'original_value', OLD.original_po_value,
        'changed_at', now()
      );
    ELSE
      v_action := 'PO_UPDATED';
      v_metadata := jsonb_build_object(
        'updated_at', now()
      );
    END IF;
  END IF;

  IF v_action IS NOT NULL THEN
    INSERT INTO public.po_audit_logs (po_id, action, metadata, created_by)
    VALUES (NEW.id, v_action, v_metadata, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_po_status ON public.purchase_orders;
DROP TRIGGER IF EXISTS trg_log_po_events ON public.purchase_orders;
CREATE TRIGGER trg_log_po_events
AFTER INSERT OR UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.log_po_events();

COMMENT ON FUNCTION public.log_po_events() IS 
'Comprehensive PO audit: PO_CREATED, STATUS_CHANGE, LEGAL_HOLD_APPLIED/RELEASED, VALUE_AMENDED. Court-ready forensics.';

-- 8️⃣ RLS HARDENING
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins manage POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Suppliers view their POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Buyers view their POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Suppliers view own POs" ON public.purchase_orders;
DROP POLICY IF EXISTS "Buyers view own POs" ON public.purchase_orders;

-- Admin full control (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins full PO control"
ON public.purchase_orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND business_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND business_type = 'admin'
  )
);

-- Suppliers: read-only via contract linkage
CREATE POLICY "Suppliers view own POs"
ON public.purchase_orders
FOR SELECT
USING (
  -- Direct supplier_id match (legacy POs)
  supplier_id = auth.uid()
  OR
  -- Contract-linked POs
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_id AND c.supplier_id = auth.uid()
  )
);

-- Buyers: read-only via contract linkage
CREATE POLICY "Buyers view own POs"
ON public.purchase_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_id AND c.buyer_id = auth.uid()
  )
);

-- 9️⃣ IMMUTABLE HASH GENERATION (Optional tamper detection)
CREATE OR REPLACE FUNCTION public.generate_po_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.po_status = 'FULFILLED' AND NEW.immutable_hash IS NULL THEN
    NEW.immutable_hash := encode(
      sha256(
        (NEW.id::text || NEW.po_number || COALESCE(NEW.po_value, NEW.total_amount)::text || 
         COALESCE(NEW.contract_id::text, '') || now()::text)::bytea
      ), 
      'hex'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_po_hash ON public.purchase_orders;
CREATE TRIGGER trg_generate_po_hash
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
WHEN (NEW.po_status = 'FULFILLED' AND OLD.po_status != 'FULFILLED')
EXECUTE FUNCTION public.generate_po_hash();

COMMENT ON FUNCTION public.generate_po_hash() IS 
'Generates SHA-256 hash on PO fulfillment for tamper detection and legal immutability.';