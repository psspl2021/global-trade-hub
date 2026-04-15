
-- 1. Prevent duplicate memberships
ALTER TABLE buyer_company_members
ADD CONSTRAINT unique_user_company UNIQUE (company_id, user_id);

-- 2. Prevent duplicate pending invites
CREATE UNIQUE INDEX idx_team_invites_pending_email_company
ON team_invites (LOWER(email), company_id)
WHERE status = 'pending';

-- 3. Company audit logs for governance
CREATE TABLE public.company_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES buyer_companies(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own company audit logs"
ON public.company_audit_logs FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT bcm.company_id FROM buyer_company_members bcm
    WHERE bcm.user_id = auth.uid() AND bcm.is_active = true
  )
);

CREATE POLICY "System can insert audit logs"
ON public.company_audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE INDEX idx_company_audit_logs_company ON company_audit_logs(company_id, created_at DESC);

-- 4. Auto-expire old invites
UPDATE team_invites
SET status = 'expired'
WHERE created_at < now() - interval '7 days'
AND status = 'pending';

-- 5. Add trigger to log membership joins
CREATE OR REPLACE FUNCTION log_member_joined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO company_audit_logs (company_id, user_id, action, metadata)
  VALUES (NEW.company_id, NEW.user_id, 'member_joined', jsonb_build_object('role', NEW.role));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_member_joined
AFTER INSERT ON buyer_company_members
FOR EACH ROW
EXECUTE FUNCTION log_member_joined();
