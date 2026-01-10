-- Add CHECK constraint for valid RFQ sources
ALTER TABLE public.requirements
ADD CONSTRAINT rfq_source_valid
CHECK (rfq_source IN ('manual', 'ai_inventory', 'import', 'api'));