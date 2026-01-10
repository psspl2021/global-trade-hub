-- Add source tracking columns to requirements table for AI inventory RFQs
ALTER TABLE public.requirements 
ADD COLUMN IF NOT EXISTS rfq_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_metadata JSONB;

-- Add index for AI inventory RFQs
CREATE INDEX IF NOT EXISTS idx_requirements_rfq_source ON public.requirements(rfq_source);

-- Add comment for documentation
COMMENT ON COLUMN public.requirements.rfq_source IS 'Source of RFQ: manual, ai_inventory, import, etc.';
COMMENT ON COLUMN public.requirements.source_product_id IS 'Product ID that triggered this RFQ (for ai_inventory source)';
COMMENT ON COLUMN public.requirements.source_metadata IS 'Additional metadata about RFQ source (visibility, version, etc.)';