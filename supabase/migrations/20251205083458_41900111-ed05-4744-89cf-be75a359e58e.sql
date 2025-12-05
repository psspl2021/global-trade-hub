-- Create a secure function to get lowest bid for a requirement
-- This bypasses RLS safely by only returning aggregated data (no supplier identities)
CREATE OR REPLACE FUNCTION public.get_lowest_bid_for_requirement(req_id uuid)
RETURNS TABLE (lowest_bid_amount numeric, bid_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    MIN(bid_amount) as lowest_bid_amount,
    COUNT(*)::integer as bid_count
  FROM bids 
  WHERE requirement_id = req_id 
    AND status = 'pending'
$$;