-- 1. Lock user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- 2. Partial index for approved contracts
CREATE INDEX IF NOT EXISTS idx_contract_approved_partial
ON public.contract_summaries(approval_status)
WHERE approval_status = 'approved';