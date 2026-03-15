
-- Auction success metrics RPC
CREATE OR REPLACE FUNCTION public.auction_success_metrics()
RETURNS TABLE(
  total_auctions bigint,
  completed_auctions bigint,
  success_rate numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) as total_auctions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_auctions,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'completed')::numeric / NULLIF(COUNT(*), 0)) * 100
    , 2) as success_rate
  FROM public.reverse_auctions;
$$;

-- Supplier participation metrics RPC
CREATE OR REPLACE FUNCTION public.supplier_bid_activity()
RETURNS TABLE(
  auction_id uuid,
  supplier_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auction_id,
    COUNT(supplier_id) as supplier_count
  FROM public.reverse_auction_suppliers
  GROUP BY auction_id;
$$;

-- Auction savings analytics RPC
CREATE OR REPLACE FUNCTION public.auction_savings()
RETURNS TABLE(
  auction_id uuid,
  starting_price numeric,
  final_price numeric,
  savings_percent numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.starting_price,
    MIN(b.bid_price) as final_price,
    ROUND(
      ((a.starting_price - MIN(b.bid_price)) / NULLIF(a.starting_price, 0)) * 100
    , 2) as savings_percent
  FROM public.reverse_auctions a
  JOIN public.reverse_auction_bids b ON a.id = b.auction_id
  GROUP BY a.id, a.starting_price;
$$;

-- Buyer procurement savings RPC
CREATE OR REPLACE FUNCTION public.buyer_procurement_savings()
RETURNS TABLE(
  total_savings numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(starting_price - final_price), 0) as total_savings
  FROM (
    SELECT
      a.starting_price,
      MIN(b.bid_price) as final_price
    FROM public.reverse_auctions a
    JOIN public.reverse_auction_bids b ON a.id = b.auction_id
    GROUP BY a.id, a.starting_price
  ) t;
$$;

-- Payment integrity verification RPC
CREATE OR REPLACE FUNCTION public.verify_auction_payments()
RETURNS TABLE(
  auctions_without_payment bigint,
  payments_without_auction bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.reverse_auctions a LEFT JOIN public.auction_payments p ON a.id = p.auction_id WHERE p.id IS NULL) as auctions_without_payment,
    (SELECT COUNT(*) FROM public.auction_payments WHERE auction_id IS NULL AND payment_status = 'consumed') as payments_without_auction;
$$;
