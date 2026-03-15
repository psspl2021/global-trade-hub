
DROP FUNCTION IF EXISTS public.verify_auction_payments();

CREATE OR REPLACE FUNCTION public.verify_auction_payments()
RETURNS TABLE(
  auctions_without_payment int,
  payments_without_auction int
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::int FROM reverse_auctions a LEFT JOIN auction_payments p ON a.id = p.auction_id WHERE p.id IS NULL AND a.status = 'completed'),
    (SELECT COUNT(*)::int FROM auction_payments WHERE auction_id IS NULL AND payment_status = 'consumed')
$$;

CREATE OR REPLACE FUNCTION public.auction_total_revenue()
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM auction_payments
  WHERE payment_status = 'consumed'
$$;

CREATE OR REPLACE FUNCTION public.auction_competition_score()
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(supplier_count), 2), 0)
  FROM (
    SELECT auction_id, COUNT(supplier_id)::numeric as supplier_count
    FROM reverse_auction_suppliers
    GROUP BY auction_id
  ) t
$$;
