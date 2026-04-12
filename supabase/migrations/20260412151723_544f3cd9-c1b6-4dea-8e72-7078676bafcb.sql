
ALTER TABLE public.po_status_history
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_po_status_history_idempotency
ON public.po_status_history (idempotency_key)
WHERE idempotency_key IS NOT NULL;
