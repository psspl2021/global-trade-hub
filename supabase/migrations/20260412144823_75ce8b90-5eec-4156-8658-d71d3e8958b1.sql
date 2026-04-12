
-- Extend purchase_orders with PO source control
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS po_source TEXT NOT NULL DEFAULT 'platform',
ADD COLUMN IF NOT EXISTS external_po_number TEXT,
ADD COLUMN IF NOT EXISTS erp_sync_enabled BOOLEAN NOT NULL DEFAULT true;

-- Extend reverse_auctions with PO generation config
ALTER TABLE public.reverse_auctions
ADD COLUMN IF NOT EXISTS enable_po_generation BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_erp_sync BOOLEAN NOT NULL DEFAULT true;

-- Index for external PO lookups
CREATE INDEX IF NOT EXISTS idx_po_external_number ON public.purchase_orders(external_po_number) WHERE external_po_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_po_source ON public.purchase_orders(po_source);
