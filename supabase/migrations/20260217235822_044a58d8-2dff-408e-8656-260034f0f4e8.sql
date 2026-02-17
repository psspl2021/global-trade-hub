CREATE INDEX IF NOT EXISTS idx_contract_buyer ON public.contract_summaries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_contract_supplier ON public.contract_summaries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contract_created ON public.contract_summaries(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_status ON public.contract_summaries(approval_status);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_ledger(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_ledger(performed_at);