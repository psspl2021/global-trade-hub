
CREATE OR REPLACE FUNCTION public.get_buyer_network_supplier_ids(p_buyer_id uuid)
RETURNS TABLE(supplier_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.supplier_id
  FROM reverse_auction_suppliers s
  JOIN reverse_auctions a ON a.id = s.auction_id
  WHERE a.buyer_id = p_buyer_id
    AND s.supplier_id IS NOT NULL

  UNION

  SELECT DISTINCT b.supplier_id
  FROM reverse_auction_bids b
  JOIN reverse_auctions a ON a.id = b.auction_id
  WHERE a.buyer_id = p_buyer_id
$$;
