-- Create validation trigger to enforce signal_page_id requirement for AI-sourced RFQs
CREATE OR REPLACE FUNCTION public.validate_rfq_source_signal_page()
RETURNS TRIGGER AS $$
BEGIN
  -- If source is from buyer intelligence or signal page, signal_page_id is mandatory
  IF NEW.source IN ('buyer_intelligence', 'signal_page') AND NEW.signal_page_id IS NULL THEN
    RAISE EXCEPTION 'RFQs from buyer intelligence or signal pages must have a signal_page_id. Bypass not allowed.';
  END IF;
  
  -- If signal_page_id is set, source must be appropriate
  IF NEW.signal_page_id IS NOT NULL AND NEW.source NOT IN ('buyer_intelligence', 'signal_page') THEN
    RAISE EXCEPTION 'RFQs with signal_page_id must have source set to buyer_intelligence or signal_page.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on requirements table
DROP TRIGGER IF EXISTS enforce_rfq_source_signal_page ON public.requirements;
CREATE TRIGGER enforce_rfq_source_signal_page
  BEFORE INSERT OR UPDATE ON public.requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_rfq_source_signal_page();

-- Add comment for documentation
COMMENT ON FUNCTION public.validate_rfq_source_signal_page() IS 'Enforces platform law: AI-sourced RFQs (buyer_intelligence, signal_page) must flow through signal pages. No bypass allowed.';