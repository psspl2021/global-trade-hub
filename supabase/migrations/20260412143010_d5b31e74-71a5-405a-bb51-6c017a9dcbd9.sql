
-- Phase 1: Add chain hashing to audit ledger
ALTER TABLE public.procurement_audit_logs
ADD COLUMN IF NOT EXISTS previous_hash TEXT;

-- Immutability trigger — prevent UPDATE and DELETE
CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable — updates and deletes are prohibited';
END;
$$;

CREATE TRIGGER no_update_delete_audit
BEFORE UPDATE OR DELETE ON public.procurement_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_mutation();

-- Chain verification function
CREATE OR REPLACE FUNCTION public.verify_audit_chain(p_po_id UUID DEFAULT NULL, p_auction_id UUID DEFAULT NULL, p_rfq_id UUID DEFAULT NULL)
RETURNS TABLE(total_records BIGINT, verified_records BIGINT, broken_at UUID, is_intact BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  prev_hash TEXT := NULL;
  total BIGINT := 0;
  verified BIGINT := 0;
  first_broken UUID := NULL;
BEGIN
  FOR rec IN
    SELECT id, previous_hash, hash_signature
    FROM public.procurement_audit_logs
    WHERE (p_po_id IS NULL OR po_id = p_po_id)
      AND (p_auction_id IS NULL OR auction_id = p_auction_id)
      AND (p_rfq_id IS NULL OR rfq_id = p_rfq_id)
    ORDER BY created_at ASC
  LOOP
    total := total + 1;
    IF rec.previous_hash IS NOT DISTINCT FROM prev_hash THEN
      verified := verified + 1;
    ELSIF first_broken IS NULL THEN
      first_broken := rec.id;
    END IF;
    prev_hash := rec.hash_signature;
  END LOOP;

  RETURN QUERY SELECT total, verified, first_broken, (total = verified);
END;
$$;

-- Phase 3: ERP Retry Queue
CREATE TABLE public.erp_sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  last_error TEXT,
  erp_type TEXT NOT NULL DEFAULT 'webhook',
  erp_endpoint TEXT,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_erp_queue_status ON public.erp_sync_queue(status);
CREATE INDEX idx_erp_queue_next_retry ON public.erp_sync_queue(next_retry_at);
CREATE INDEX idx_erp_queue_po ON public.erp_sync_queue(po_id);

ALTER TABLE public.erp_sync_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view all queue entries
CREATE POLICY "Admins can view erp queue"
ON public.erp_sync_queue
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert
CREATE POLICY "Authenticated can insert erp queue"
ON public.erp_sync_queue
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins can update queue entries (for retry worker)
CREATE POLICY "Admins can update erp queue"
ON public.erp_sync_queue
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
