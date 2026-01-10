-- Safe idempotent constraint: drop if exists, then recreate
ALTER TABLE public.requirements
DROP CONSTRAINT IF EXISTS rfq_source_valid;

ALTER TABLE public.requirements
ADD CONSTRAINT rfq_source_valid
CHECK (rfq_source IN ('manual', 'ai_inventory', 'import', 'api'));