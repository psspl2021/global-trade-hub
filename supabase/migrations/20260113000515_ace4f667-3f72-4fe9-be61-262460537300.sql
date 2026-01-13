-- ═══════════════════════════════════════════════════════════════════════════
-- FINAL ENTERPRISE HARDENING (Litigation-Grade)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣ LOCK IMMUTABLE HASH (Forensically Defensible)
CREATE OR REPLACE FUNCTION public.prevent_po_hash_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.immutable_hash IS NOT NULL
     AND NEW.immutable_hash IS DISTINCT FROM OLD.immutable_hash THEN
    RAISE EXCEPTION 'Immutable hash cannot be modified once set. PO %.', OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_po_hash_mutation() IS 
'Prevents tampering with SHA-256 hash after PO fulfillment. Required for litigation and forensic integrity.';

DROP TRIGGER IF EXISTS trg_lock_po_hash ON public.purchase_orders;
CREATE TRIGGER trg_lock_po_hash
BEFORE UPDATE OF immutable_hash ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_po_hash_mutation();

-- 2️⃣ LOCK ORIGINAL PO VALUE (Commercial Immutability)
CREATE OR REPLACE FUNCTION public.lock_original_po_value()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.original_po_value IS NOT NULL
     AND NEW.original_po_value IS DISTINCT FROM OLD.original_po_value THEN
    RAISE EXCEPTION 'original_po_value is immutable and cannot be changed. PO %.', OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.lock_original_po_value() IS 
'Guarantees commercial immutability by preventing any modification to the original PO value after creation.';

DROP TRIGGER IF EXISTS trg_lock_original_po_value ON public.purchase_orders;
CREATE TRIGGER trg_lock_original_po_value
BEFORE UPDATE OF original_po_value ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.lock_original_po_value();

-- 3️⃣ LOCK value_locked_at TIMESTAMP (Prevents Backdating)
CREATE OR REPLACE FUNCTION public.lock_value_locked_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.value_locked_at IS NOT NULL
     AND NEW.value_locked_at IS DISTINCT FROM OLD.value_locked_at THEN
    RAISE EXCEPTION 'value_locked_at timestamp is immutable. PO %.', OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.lock_value_locked_at() IS 
'Prevents backdating attacks by locking the value_locked_at timestamp after PO creation.';

DROP TRIGGER IF EXISTS trg_lock_value_locked_at ON public.purchase_orders;
CREATE TRIGGER trg_lock_value_locked_at
BEFORE UPDATE OF value_locked_at ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.lock_value_locked_at();