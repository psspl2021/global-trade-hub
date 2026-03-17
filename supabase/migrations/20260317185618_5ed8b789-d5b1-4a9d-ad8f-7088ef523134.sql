
-- Enforce that at least one of supplier_id or supplier_email must be present
ALTER TABLE public.reverse_auction_suppliers
  ADD CONSTRAINT check_supplier_identity
  CHECK (supplier_id IS NOT NULL OR supplier_email IS NOT NULL);

-- Composite lookup index for fast access checks
CREATE INDEX IF NOT EXISTS idx_reverse_auction_supplier_lookup
  ON public.reverse_auction_suppliers (auction_id, supplier_id, supplier_email);

-- Security definer function for supplier access check (safe for RLS use)
CREATE OR REPLACE FUNCTION public.can_supplier_access_auction(
  p_auction_id uuid,
  p_supplier_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM reverse_auction_suppliers
    WHERE auction_id = p_auction_id
      AND (
        supplier_id = p_supplier_id
        OR supplier_email = p_email
      )
  );
$$;
