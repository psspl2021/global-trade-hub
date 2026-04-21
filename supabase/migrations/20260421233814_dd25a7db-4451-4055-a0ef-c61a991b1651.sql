-- Fix: ON CONFLICT (idempotency_key) in PO approval RPCs cannot match a partial unique index.
-- Replace partial unique indexes with a full unique index so ON CONFLICT resolves correctly.

DROP INDEX IF EXISTS public.idx_po_approval_idempotency;
DROP INDEX IF EXISTS public.po_approval_logs_idem_key;

CREATE UNIQUE INDEX IF NOT EXISTS po_approval_logs_idempotency_key_uidx
  ON public.po_approval_logs (idempotency_key);
