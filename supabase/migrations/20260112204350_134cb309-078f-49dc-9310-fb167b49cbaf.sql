-- Add award columns to bids table (since awards are tracked via bid status)
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS award_type TEXT CHECK (award_type IN ('FULL', 'PARTIAL')),
ADD COLUMN IF NOT EXISTS award_justification TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create award audit logs table for immutable audit trail
CREATE TABLE IF NOT EXISTS public.award_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
  requirement_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  award_type TEXT,
  coverage_percentage NUMERIC,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on award_audit_logs
ALTER TABLE public.award_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access to audit logs
CREATE POLICY "Admin can view award audit logs"
ON public.award_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin can insert award audit logs"
ON public.award_audit_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_award_audit_logs_bid_id ON public.award_audit_logs(bid_id);
CREATE INDEX IF NOT EXISTS idx_award_audit_logs_requirement_id ON public.award_audit_logs(requirement_id);
CREATE INDEX IF NOT EXISTS idx_bids_award_type ON public.bids(award_type) WHERE award_type IS NOT NULL;