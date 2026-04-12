
-- Add ERP sync policy to buyer_companies (org-level control)
ALTER TABLE public.buyer_companies
ADD COLUMN IF NOT EXISTS erp_sync_policy TEXT NOT NULL DEFAULT 'optional';

-- Supplier PO acknowledgement table
CREATE TABLE public.supplier_po_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  confirmed_po_number TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_po_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Suppliers can insert their own confirmations
CREATE POLICY "Suppliers can confirm PO numbers"
ON public.supplier_po_acknowledgements
FOR INSERT
WITH CHECK (supplier_id = auth.uid());

-- Suppliers and buyers can view confirmations for their POs
CREATE POLICY "Users can view PO confirmations"
ON public.supplier_po_acknowledgements
FOR SELECT
USING (
  supplier_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = po_id AND po.created_by = auth.uid()
  )
);

-- Workflow validation function: checks if external PO is supplier-confirmed
CREATE OR REPLACE FUNCTION public.validate_external_po(p_po_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po RECORD;
  v_confirmed BOOLEAN;
BEGIN
  SELECT po_source, external_po_number, status
  INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'PO not found');
  END IF;

  IF v_po.po_source = 'platform' OR v_po.po_source IS NULL THEN
    RETURN jsonb_build_object('valid', true);
  END IF;

  IF v_po.external_po_number IS NULL OR v_po.external_po_number = '' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'External PO number missing');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.supplier_po_acknowledgements
    WHERE po_id = p_po_id
    AND confirmed_po_number = v_po.external_po_number
  ) INTO v_confirmed;

  IF NOT v_confirmed THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Supplier has not confirmed this PO number');
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- Get company ERP policy
CREATE OR REPLACE FUNCTION public.get_company_erp_policy(p_company_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(erp_sync_policy, 'optional')
  FROM public.buyer_companies
  WHERE id = p_company_id;
$$;
