-- Fix the auto_generate_contract trigger to use correct column name
-- The requirements table uses buyer_id, not customer_id

CREATE OR REPLACE FUNCTION public.auto_generate_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      r.buyer_id,  -- FIXED: was r.customer_id
      NEW.award_type,
      NEW.award_coverage_percentage,
      CASE
        WHEN NEW.award_type = 'FULL'
          THEN NEW.total_amount
        ELSE
          NEW.total_amount * (COALESCE(NEW.award_coverage_percentage, 100) / 100)
      END,
      auth.uid()
    FROM public.requirements r
    WHERE r.id = NEW.requirement_id
    ON CONFLICT (bid_id) DO NOTHING;
  END IF;

  -- Auto-terminate ONLY pre-signature contracts when award is revoked
  IF NEW.award_type IS NULL AND OLD.award_type IS NOT NULL THEN
    UPDATE public.contracts
    SET contract_status = 'TERMINATED'
    WHERE bid_id = NEW.id
      AND contract_status IN ('DRAFT', 'SENT', 'ACTIVE');

    -- Audit log for terminated contracts
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
    WHERE c.bid_id = NEW.id
      AND c.contract_status = 'TERMINATED';
  END IF;

  RETURN NEW;
END;
$$;