-- Add logistics execution mode to bids table
-- Values: 'supplier_direct' (supplier ships directly) or 'platform_arranged' (ProcureSaathi arranges logistics)
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS logistics_execution_mode text DEFAULT 'supplier_direct';

-- Add logistics handling info columns
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS logistics_notes text;

-- Add constraint for valid values
ALTER TABLE public.bids 
ADD CONSTRAINT bids_logistics_execution_mode_check 
CHECK (logistics_execution_mode IN ('supplier_direct', 'platform_arranged'));

-- Add comment for documentation
COMMENT ON COLUMN public.bids.logistics_execution_mode IS 'Backend-controlled logistics mode: supplier_direct (supplier ships to Ship-To) or platform_arranged (ProcureSaathi handles pickup/delivery). Always shown as ProcureSaathi Solutions to buyer.';

-- Create function to get logistics info for buyers (always returns ProcureSaathi)
CREATE OR REPLACE FUNCTION public.get_logistics_handler_for_buyer(p_bid_id uuid)
RETURNS TABLE(
  logistics_handler_name text,
  logistics_handler_contact text,
  logistics_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'ProcureSaathi Solutions Pvt. Ltd.'::text as logistics_handler_name,
    'logistics@procuresaathi.com'::text as logistics_handler_contact,
    CASE 
      WHEN b.status = 'accepted' THEN 'Logistics arranged'
      WHEN b.status = 'pending' THEN 'Pending confirmation'
      ELSE 'Not applicable'
    END as logistics_status
  FROM bids b
  WHERE b.id = p_bid_id;
$$;

-- Create function to get logistics details for admin/internal use
CREATE OR REPLACE FUNCTION public.get_logistics_details_internal(p_bid_id uuid)
RETURNS TABLE(
  bid_id uuid,
  logistics_execution_mode text,
  logistics_notes text,
  actual_handler_id uuid,
  supplier_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id as bid_id,
    b.logistics_execution_mode,
    b.logistics_notes,
    CASE 
      WHEN b.logistics_execution_mode = 'supplier_direct' THEN b.supplier_id
      ELSE NULL -- Platform handles it
    END as actual_handler_id,
    b.supplier_id
  FROM bids b
  WHERE b.id = p_bid_id
    AND has_role(auth.uid(), 'admin'::app_role);
$$;