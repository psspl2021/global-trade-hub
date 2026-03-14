
-- Fast reporting index on consumed_at for revenue dashboards
CREATE INDEX idx_auction_payments_consumed_at
ON public.auction_payments(consumed_at)
WHERE payment_status = 'consumed';

-- Revenue per buyer view for finance/governance
CREATE VIEW public.buyer_auction_revenue AS
SELECT
  buyer_id,
  COUNT(*) AS auctions,
  SUM(total_amount) AS revenue,
  SUM(base_fee) AS base_revenue,
  SUM(gst) AS total_gst
FROM public.auction_payments
WHERE payment_status = 'consumed'
GROUP BY buyer_id;
