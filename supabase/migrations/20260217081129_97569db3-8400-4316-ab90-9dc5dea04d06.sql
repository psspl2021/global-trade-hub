
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.audit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    performed_by UUID,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    old_data JSONB,
    new_data JSONB,
    prev_hash TEXT,
    record_hash TEXT NOT NULL
);

-- Immutable: prevent UPDATE/DELETE
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Audit ledger is immutable. Modification is not allowed.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_audit_update ON public.audit_ledger;
CREATE TRIGGER prevent_audit_update
BEFORE UPDATE OR DELETE ON public.audit_ledger
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_modification();

-- Hash chain function
CREATE OR REPLACE FUNCTION public.generate_audit_hash(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_action TEXT,
    p_performed_by UUID,
    p_old JSONB,
    p_new JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    last_hash TEXT;
    combined TEXT;
BEGIN
    SELECT record_hash
    INTO last_hash
    FROM public.audit_ledger
    ORDER BY performed_at DESC
    LIMIT 1;

    combined :=
        COALESCE(last_hash, '') ||
        p_entity_type ||
        p_entity_id::TEXT ||
        p_action ||
        COALESCE(p_performed_by::TEXT, '') ||
        COALESCE(p_old::TEXT, '') ||
        COALESCE(p_new::TEXT, '') ||
        now()::TEXT;

    RETURN encode(digest(combined, 'sha256'), 'hex');
END;
$$;

-- Auto-log contract changes
CREATE OR REPLACE FUNCTION public.log_contract_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_hash TEXT;
BEGIN
    new_hash := public.generate_audit_hash(
        'contract_summaries',
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        auth.uid(),
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );

    INSERT INTO public.audit_ledger (
        entity_type,
        entity_id,
        action,
        performed_by,
        old_data,
        new_data,
        prev_hash,
        record_hash
    )
    VALUES (
        'contract_summaries',
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        auth.uid(),
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        (SELECT record_hash FROM public.audit_ledger ORDER BY performed_at DESC LIMIT 1),
        new_hash
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contract_audit_trigger ON public.contract_summaries;
CREATE TRIGGER contract_audit_trigger
AFTER INSERT OR UPDATE ON public.contract_summaries
FOR EACH ROW
EXECUTE FUNCTION public.log_contract_changes();

-- RLS: admin/cfo read-only, no write policies
ALTER TABLE public.audit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_admin_read ON public.audit_ledger;
CREATE POLICY audit_admin_read
ON public.audit_ledger
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role, 'cfo'::app_role])
    )
);

NOTIFY pgrst, 'reload schema';
