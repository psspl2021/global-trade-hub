-- 1️⃣ Update trigger to also terminate contracts when awards are revoked
CREATE OR REPLACE FUNCTION public.auto_generate_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Generate contract when bid becomes awarded
  IF NEW.award_type IS NOT NULL AND OLD.award_type IS NULL THEN
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
      CASE 
        WHEN NEW.award_type = 'PARTIAL' THEN 
          COALESCE((NEW.award_justification::jsonb->>'coverage_percentage')::numeric, 50)
        ELSE NULL
      END,
      CASE
        WHEN NEW.award_type = 'FULL' THEN NEW.total_amount
        ELSE NEW.total_amount * (COALESCE((NEW.award_justification::jsonb->>'coverage_percentage')::numeric, 50) / 100)
      END,
      auth.uid()
    FROM public.requirements r
    WHERE r.id = NEW.requirement_id;
  END IF;

  -- Auto-terminate contract when award is revoked
  IF NEW.award_type IS NULL AND OLD.award_type IS NOT NULL THEN
    UPDATE public.contracts
    SET contract_status = 'TERMINATED'
    WHERE bid_id = NEW.id
      AND contract_status != 'TERMINATED';
    
    -- Log the termination
    INSERT INTO public.contract_audit_logs (contract_id, action, metadata, created_by)
    SELECT 
      c.id,
      'AUTO_TERMINATED',
      jsonb_build_object(
        'reason', 'Award revoked',
        'previous_award_type', OLD.award_type,
        'terminated_at', now()
      ),
      auth.uid()
    FROM public.contracts c
    WHERE c.bid_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.auto_generate_contract() IS 
'Auto-generates contracts on bid award and auto-terminates on award revocation. SECURITY DEFINER to bypass RLS.';

-- 2️⃣ Drop existing permissive INSERT policies and replace with restrictive ones
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;

-- Disallow manual inserts (trigger uses SECURITY DEFINER to bypass)
CREATE POLICY "Disallow manual insert"
ON public.contracts
FOR INSERT
WITH CHECK (false);

-- Admins can only SELECT, UPDATE, DELETE (not INSERT) - using business_type = 'admin'
CREATE POLICY "Admins can view all contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.business_type = 'admin'
  )
);

CREATE POLICY "Admins can update contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.business_type = 'admin'
  )
);

CREATE POLICY "Admins can delete contracts"
ON public.contracts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.business_type = 'admin'
  )
);