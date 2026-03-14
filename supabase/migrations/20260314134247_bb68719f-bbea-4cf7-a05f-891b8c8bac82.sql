
CREATE OR REPLACE FUNCTION public.auction_revenue_daily()
RETURNS TABLE(
  date date,
  revenue numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(consumed_at) as date,
    SUM(total_amount) as revenue
  FROM public.auction_payments
  WHERE payment_status = 'consumed'
  GROUP BY 1
  ORDER BY 1
$$;
