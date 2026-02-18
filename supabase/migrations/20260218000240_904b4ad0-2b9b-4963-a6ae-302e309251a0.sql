-- AUDIT COMPOSITE INDEX (entity_type + entity_id)
CREATE INDEX IF NOT EXISTS idx_audit_entity_composite
ON public.audit_ledger(entity_type, entity_id);

-- AUDIT PERFORMED_AT INDEX
CREATE INDEX IF NOT EXISTS idx_audit_performed_at
ON public.audit_ledger(performed_at);

-- SEARCH_PATH HARDENING FOR SECURITY DEFINER FUNCTIONS
ALTER FUNCTION public.enforce_governance_rules() SET search_path = public;
ALTER FUNCTION public.enforce_finance_routing() SET search_path = public;
ALTER FUNCTION public.log_contract_changes() SET search_path = public;