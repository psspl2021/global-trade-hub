-- Add contact reveal monetization columns to requirements table
ALTER TABLE public.requirements 
ADD COLUMN IF NOT EXISTS reveal_status TEXT DEFAULT 'locked' CHECK (reveal_status IN ('locked', 'requested', 'paid', 'revealed')),
ADD COLUMN IF NOT EXISTS reveal_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reveal_unlocked_at TIMESTAMP WITH TIME ZONE;

-- Comment on columns
COMMENT ON COLUMN public.requirements.reveal_status IS 'Contact reveal status: locked (default), requested (buyer wants reveal), paid (payment received), revealed (contact shared)';
COMMENT ON COLUMN public.requirements.reveal_fee IS 'Fee charged for contact reveal (INR)';
COMMENT ON COLUMN public.requirements.reveal_unlocked_at IS 'Timestamp when contact was revealed to buyer';

-- Add supplier reveal tracking table for granular control
CREATE TABLE IF NOT EXISTS public.requirement_supplier_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  reveal_status TEXT NOT NULL DEFAULT 'locked' CHECK (reveal_status IN ('locked', 'requested', 'paid', 'revealed')),
  reveal_fee NUMERIC DEFAULT 0,
  payment_id UUID,
  requested_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  revealed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(requirement_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.requirement_supplier_reveals ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own reveal requests
CREATE POLICY "Buyers can view their reveal requests"
ON public.requirement_supplier_reveals
FOR SELECT
TO authenticated
USING (
  requirement_id IN (SELECT id FROM public.requirements WHERE buyer_id = auth.uid())
);

-- Suppliers can view reveals for their bids
CREATE POLICY "Suppliers can view reveals for their bids"
ON public.requirement_supplier_reveals
FOR SELECT
TO authenticated
USING (supplier_id = auth.uid());

-- Buyers can request reveals for their requirements
CREATE POLICY "Buyers can request reveals"
ON public.requirement_supplier_reveals
FOR INSERT
TO authenticated
WITH CHECK (
  requirement_id IN (SELECT id FROM public.requirements WHERE buyer_id = auth.uid())
);

-- Buyers can update their reveal requests (payment status)
CREATE POLICY "Buyers can update their reveals"
ON public.requirement_supplier_reveals
FOR UPDATE
TO authenticated
USING (
  requirement_id IN (SELECT id FROM public.requirements WHERE buyer_id = auth.uid())
);

COMMENT ON TABLE public.requirement_supplier_reveals IS 'Tracks contact reveal status per supplier per requirement. Core monetization table for paid reveals.';