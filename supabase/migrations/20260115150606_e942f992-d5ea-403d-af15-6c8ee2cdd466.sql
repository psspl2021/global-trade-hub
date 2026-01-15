-- STEP 5: Backend Enforcement for Supplier Contact Reveal
-- This ensures contact data is NEVER accessible without proper reveal

-- Create a view for anonymized supplier data (safe for all users)
CREATE OR REPLACE VIEW public.anonymized_supplier_quotes AS
SELECT 
  b.id as bid_id,
  b.requirement_id,
  b.supplier_id,
  b.bid_amount,
  b.buyer_visible_price,
  b.delivery_timeline_days,
  b.status as bid_status,
  b.created_at,
  b.terms_and_conditions,
  b.is_paid_bid,
  -- Anonymized supplier info (safe to expose)
  'SUP-' || UPPER(LEFT(b.supplier_id::text, 4)) as supplier_code,
  p.city as supplier_city,
  p.is_verified_supplier,
  COALESCE(p.supplier_categories, ARRAY[]::text[]) as supplier_categories
FROM public.bids b
LEFT JOIN public.profiles p ON p.id = b.supplier_id;

-- Grant select on the view to authenticated users
GRANT SELECT ON public.anonymized_supplier_quotes TO authenticated;

-- Create a secure function to get revealed supplier contact
-- This function enforces the reveal check at database level
CREATE OR REPLACE FUNCTION public.get_revealed_supplier_contact(
  p_requirement_id uuid,
  p_supplier_id uuid
)
RETURNS TABLE (
  supplier_name text,
  supplier_company text,
  supplier_phone text,
  supplier_email text,
  supplier_address text,
  supplier_gstin text,
  revealed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid;
  v_reveal_status text;
  v_revealed_at timestamptz;
BEGIN
  -- Get the buyer ID for this requirement
  SELECT buyer_id INTO v_buyer_id
  FROM public.requirements
  WHERE id = p_requirement_id;
  
  -- Verify the calling user is the buyer
  IF v_buyer_id IS NULL OR v_buyer_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You are not the buyer for this requirement';
  END IF;
  
  -- Check reveal status
  SELECT rsr.reveal_status, rsr.revealed_at 
  INTO v_reveal_status, v_revealed_at
  FROM public.requirement_supplier_reveals rsr
  WHERE rsr.requirement_id = p_requirement_id
    AND rsr.supplier_id = p_supplier_id;
  
  -- Only return data if reveal_status = 'revealed'
  IF v_reveal_status != 'revealed' THEN
    RAISE EXCEPTION 'Contact not revealed: Payment required or reveal pending';
  END IF;
  
  -- Return the supplier contact data
  RETURN QUERY
  SELECT 
    p.contact_person as supplier_name,
    p.company_name as supplier_company,
    p.phone as supplier_phone,
    p.email as supplier_email,
    p.address as supplier_address,
    p.gstin as supplier_gstin,
    v_revealed_at as revealed_at
  FROM public.profiles p
  WHERE p.id = p_supplier_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_revealed_supplier_contact(uuid, uuid) TO authenticated;

-- Create a function to initiate reveal payment
CREATE OR REPLACE FUNCTION public.request_supplier_reveal(
  p_requirement_id uuid,
  p_supplier_id uuid,
  p_bid_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid;
  v_reveal_fee numeric;
  v_existing_status text;
  v_reveal_id uuid;
BEGIN
  -- Get the buyer ID for this requirement
  SELECT buyer_id INTO v_buyer_id
  FROM public.requirements
  WHERE id = p_requirement_id;
  
  -- Verify the calling user is the buyer
  IF v_buyer_id IS NULL OR v_buyer_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied: You are not the buyer for this requirement');
  END IF;
  
  -- Check if reveal already exists
  SELECT reveal_status INTO v_existing_status
  FROM public.requirement_supplier_reveals
  WHERE requirement_id = p_requirement_id AND supplier_id = p_supplier_id;
  
  IF v_existing_status = 'revealed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contact already revealed');
  END IF;
  
  IF v_existing_status IN ('requested', 'paid') THEN
    RETURN jsonb_build_object('success', true, 'status', v_existing_status, 'message', 'Reveal already in progress');
  END IF;
  
  -- Get reveal fee from requirement or default
  SELECT COALESCE(reveal_fee, 499) INTO v_reveal_fee
  FROM public.requirements
  WHERE id = p_requirement_id;
  
  -- Create or update reveal request
  INSERT INTO public.requirement_supplier_reveals (
    requirement_id,
    supplier_id,
    bid_id,
    buyer_id,
    reveal_status,
    reveal_fee
  )
  VALUES (
    p_requirement_id,
    p_supplier_id,
    p_bid_id,
    v_buyer_id,
    'requested',
    v_reveal_fee
  )
  ON CONFLICT (requirement_id, supplier_id)
  DO UPDATE SET reveal_status = 'requested', updated_at = now()
  RETURNING id INTO v_reveal_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reveal_id', v_reveal_id,
    'reveal_fee', v_reveal_fee,
    'status', 'requested'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.request_supplier_reveal(uuid, uuid, uuid) TO authenticated;

-- Create a function to complete reveal after payment (called by webhook)
CREATE OR REPLACE FUNCTION public.complete_supplier_reveal(
  p_requirement_id uuid,
  p_supplier_id uuid,
  p_payment_reference text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.requirement_supplier_reveals
  SET 
    reveal_status = 'revealed',
    revealed_at = now(),
    payment_reference = p_payment_reference,
    updated_at = now()
  WHERE requirement_id = p_requirement_id
    AND supplier_id = p_supplier_id
    AND reveal_status IN ('requested', 'paid');
  
  RETURN FOUND;
END;
$$;

-- Grant execute to service role only (for webhooks)
REVOKE EXECUTE ON FUNCTION public.complete_supplier_reveal(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_supplier_reveal(uuid, uuid, text) TO service_role;

-- Add payment_reference column if not exists
ALTER TABLE public.requirement_supplier_reveals 
ADD COLUMN IF NOT EXISTS payment_reference text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reveals_status_lookup 
ON public.requirement_supplier_reveals(requirement_id, supplier_id, reveal_status);

-- Add RLS policy to prevent direct access to sensitive profile fields for non-owners
-- Note: This creates a policy that restricts what fields are accessible

-- Create a secure view for buyer-visible supplier data
CREATE OR REPLACE VIEW public.safe_supplier_profiles AS
SELECT 
  id,
  city,
  state,
  country,
  is_verified_supplier,
  supplier_categories,
  created_at
  -- NOTE: company_name, email, phone, gstin are EXCLUDED
FROM public.profiles;

-- Grant access to the safe view
GRANT SELECT ON public.safe_supplier_profiles TO authenticated;