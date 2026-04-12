
-- Procurement Audit Ledger — immutable, tamper-proof action log
CREATE TABLE public.procurement_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID NULL,
  auction_id UUID NULL,
  po_id UUID NULL,
  action_type TEXT NOT NULL,
  performed_by UUID NOT NULL,
  performed_by_role TEXT NOT NULL DEFAULT 'system',
  old_value JSONB NULL,
  new_value JSONB NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  is_system_action BOOLEAN NOT NULL DEFAULT false,
  hash_signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_procurement_audit_rfq ON public.procurement_audit_logs(rfq_id);
CREATE INDEX idx_procurement_audit_auction ON public.procurement_audit_logs(auction_id);
CREATE INDEX idx_procurement_audit_po ON public.procurement_audit_logs(po_id);
CREATE INDEX idx_procurement_audit_action ON public.procurement_audit_logs(action_type);
CREATE INDEX idx_procurement_audit_performer ON public.procurement_audit_logs(performed_by);
CREATE INDEX idx_procurement_audit_created ON public.procurement_audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.procurement_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit entries
CREATE POLICY "Users can view own audit logs"
ON public.procurement_audit_logs
FOR SELECT
TO authenticated
USING (performed_by = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.procurement_audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert audit logs (immutable — no update/delete)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.procurement_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add ERP sync columns to purchase_orders if not exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'erp_sync_status') THEN
      ALTER TABLE public.purchase_orders ADD COLUMN erp_sync_status TEXT DEFAULT 'pending';
      ALTER TABLE public.purchase_orders ADD COLUMN erp_reference_id TEXT NULL;
      ALTER TABLE public.purchase_orders ADD COLUMN erp_response JSONB NULL;
    END IF;
  END IF;
END $$;
