-- Update the function to get lowest bid including accepted bids (not just pending)
CREATE OR REPLACE FUNCTION public.get_lowest_bid_for_requirement(req_id uuid)
 RETURNS TABLE(lowest_bid_amount numeric, bid_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    MIN(bid_amount) as lowest_bid_amount,
    COUNT(*)::integer as bid_count
  FROM bids 
  WHERE requirement_id = req_id 
    AND status IN ('pending', 'accepted')
$function$;