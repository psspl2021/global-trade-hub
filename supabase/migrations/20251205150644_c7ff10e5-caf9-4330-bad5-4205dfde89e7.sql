-- Fix critical profile exposure vulnerability
-- Only allow profile access when there's an ACCEPTED bid relationship
CREATE OR REPLACE FUNCTION public.has_business_relationship(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Buyer viewing supplier who has an ACCEPTED bid on their requirement
    SELECT 1 FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE b.status = 'accepted'
    AND r.buyer_id = _viewer_id 
    AND b.supplier_id = _profile_id
    
    UNION
    
    -- Supplier viewing buyer whose requirement they won (ACCEPTED bid)
    SELECT 1 FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE b.status = 'accepted'
    AND b.supplier_id = _viewer_id 
    AND r.buyer_id = _profile_id
  )
$$;