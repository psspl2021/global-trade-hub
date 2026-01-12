-- ============================================
-- CONTRACT AUTO-GENERATION SYSTEM
-- ============================================

-- 1️⃣ Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  requirement_id UUID NOT NULL REFERENCES public.requirements(id),
  bid_id UUID NOT NULL REFERENCES public.bids(id),
  
  supplier_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  
  contract_type TEXT NOT NULL CHECK (contract_type IN ('FULL', 'PARTIAL')),
  coverage_percentage NUMERIC CHECK (
    coverage_percentage IS NULL
    OR (coverage_percentage > 0 AND coverage_percentage <= 100)
  ),
  
  contract_value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  contract_status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (contract_status IN ('DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'TERMINATED')),
  
  contract_pdf_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- 2️⃣ Prevent duplicate contracts per bid
CREATE UNIQUE INDEX uniq_contract_per_bid ON public.contracts (bid_id);

-- 3️⃣ Additional indexes for performance
CREATE INDEX idx_contracts_requirement ON public.contracts (requirement_id);
CREATE INDEX idx_contracts_supplier ON public.contracts (supplier_id);
CREATE INDEX idx_contracts_buyer ON public.contracts (buyer_id);
CREATE INDEX idx_contracts_status ON public.contracts (contract_status);

-- 4️⃣ Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- 5️⃣ RLS Policies
CREATE POLICY "Admins can manage all contracts"
  ON public.contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Suppliers can view their contracts"
  ON public.contracts FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Buyers can view their contracts"
  ON public.contracts FOR SELECT
  USING (buyer_id = auth.uid());

-- 6️⃣ Contract auto-generation trigger function
CREATE OR REPLACE FUNCTION public.auto_generate_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only generate when bid becomes awarded (award_type changes from NULL to a value)
  IF NEW.award_type IS NOT NULL AND (OLD.award_type IS NULL OR OLD.award_type != NEW.award_type) THEN
    
    -- Insert contract (ON CONFLICT handles idempotency via unique index)
    INSERT INTO public.contracts (
      requirement_id,
      bid_id,
      supplier_id,
      buyer_id,
      contract_type,
      coverage_percentage,
      contract_value,
      created_by
    )
    SELECT
      NEW.requirement_id,
      NEW.id,
      NEW.supplier_id,
      r.customer_id,
      NEW.award_type,
      NEW.award_coverage_percentage,
      -- Value calculation: FULL uses total_amount, PARTIAL uses proportional
      CASE
        WHEN NEW.award_type = 'FULL' THEN NEW.total_amount
        ELSE NEW.total_amount * (COALESCE(NEW.award_coverage_percentage, 100) / 100)
      END,
      auth.uid()
    FROM public.requirements r
    WHERE r.id = NEW.requirement_id
    ON CONFLICT (bid_id) DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$;

-- 7️⃣ Create trigger for auto-generation
DROP TRIGGER IF EXISTS trg_auto_generate_contract ON public.bids;
CREATE TRIGGER trg_auto_generate_contract
  AFTER UPDATE OF award_type ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_contract();

-- 8️⃣ Contract audit logs table
CREATE TABLE public.contract_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9️⃣ Enable RLS on audit logs
ALTER TABLE public.contract_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all contract audit logs"
  ON public.contract_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 🔟 Add trigger to log contract status changes
CREATE OR REPLACE FUNCTION public.log_contract_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.contract_status IS DISTINCT FROM NEW.contract_status THEN
    INSERT INTO public.contract_audit_logs (contract_id, action, metadata, created_by)
    VALUES (
      NEW.id,
      'STATUS_CHANGE',
      jsonb_build_object(
        'old_status', OLD.contract_status,
        'new_status', NEW.contract_status,
        'timestamp', now()
      ),
      auth.uid()
    );
  END IF;
  
  IF NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN
    INSERT INTO public.contract_audit_logs (contract_id, action, metadata, created_by)
    VALUES (
      NEW.id,
      'SIGNED',
      jsonb_build_object('signed_at', NEW.signed_at),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_contract_status
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contract_status_change();

-- Add comments for documentation
COMMENT ON TABLE public.contracts IS 'Auto-generated contracts from awarded bids - one contract per awarded bid';
COMMENT ON TABLE public.contract_audit_logs IS 'Audit trail for contract status changes and signatures';
COMMENT ON FUNCTION public.auto_generate_contract() IS 'Automatically creates a contract when a bid is awarded';