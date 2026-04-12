
-- Buyer Auction Usage Tracking
CREATE TABLE public.buyer_auction_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
  total_bids_received INT DEFAULT 0,
  unique_suppliers INT DEFAULT 0,
  auction_duration_seconds INT DEFAULT 0,
  used_reverse_auction BOOLEAN DEFAULT true,
  first_bid_price NUMERIC,
  winning_price NUMERIC,
  price_drop_pct NUMERIC GENERATED ALWAYS AS (
    CASE WHEN first_bid_price > 0 AND winning_price IS NOT NULL
      THEN ROUND(((first_bid_price - winning_price) / first_bid_price) * 100, 2)
      ELSE 0
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.buyer_auction_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read buyer_auction_usage"
  ON public.buyer_auction_usage FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_buyer_auction_usage_buyer ON public.buyer_auction_usage(buyer_id);
CREATE INDEX idx_buyer_auction_usage_auction ON public.buyer_auction_usage(auction_id);

-- PO Email Logs
CREATE TABLE public.po_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID,
  buyer_id UUID NOT NULL,
  supplier_id UUID,
  email_type TEXT NOT NULL DEFAULT 'po_sent',
  status TEXT NOT NULL DEFAULT 'sent',
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT
);

ALTER TABLE public.po_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read po_email_logs"
  ON public.po_email_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_po_email_logs_buyer ON public.po_email_logs(buyer_id);
CREATE INDEX idx_po_email_logs_status ON public.po_email_logs(status);

-- RPC: Get auction intelligence metrics
CREATE OR REPLACE FUNCTION public.get_auction_intelligence()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_auctions', (SELECT COUNT(*) FROM reverse_auctions),
    'completed_auctions', (SELECT COUNT(*) FROM reverse_auctions WHERE status = 'completed'),
    'avg_bids_per_auction', (
      SELECT ROUND(AVG(bid_count), 1) FROM (
        SELECT auction_id, COUNT(*) as bid_count
        FROM reverse_auction_bids GROUP BY auction_id
      ) t
    ),
    'avg_suppliers_per_auction', (
      SELECT ROUND(AVG(supplier_count), 1) FROM (
        SELECT auction_id, COUNT(DISTINCT supplier_id) as supplier_count
        FROM reverse_auction_bids GROUP BY auction_id
      ) t
    ),
    'avg_price_drop_pct', (
      SELECT ROUND(AVG(price_drop_pct), 2) FROM buyer_auction_usage WHERE price_drop_pct > 0
    ),
    'po_emails_sent', (SELECT COUNT(*) FROM po_email_logs),
    'po_emails_opened', (SELECT COUNT(*) FROM po_email_logs WHERE opened_at IS NOT NULL),
    'po_emails_failed', (SELECT COUNT(*) FROM po_email_logs WHERE status = 'failed')
  ) INTO result;
  RETURN result;
END;
$$;

-- RPC: Get supplier leaderboard
CREATE OR REPLACE FUNCTION public.get_supplier_auction_leaderboard()
RETURNS TABLE(
  supplier_id UUID,
  auctions_participated BIGINT,
  wins BIGINT,
  win_rate NUMERIC,
  avg_bid_rank NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.supplier_id,
    COUNT(DISTINCT b.auction_id) as auctions_participated,
    COUNT(DISTINCT CASE WHEN ra.winner_supplier_id = b.supplier_id THEN ra.id END) as wins,
    ROUND(
      COUNT(DISTINCT CASE WHEN ra.winner_supplier_id = b.supplier_id THEN ra.id END)::NUMERIC
      / NULLIF(COUNT(DISTINCT b.auction_id), 0) * 100, 1
    ) as win_rate,
    ROUND(AVG(
      (SELECT COUNT(*) + 1 FROM reverse_auction_bids b2
       WHERE b2.auction_id = b.auction_id AND b2.bid_price < b.bid_price)
    ), 1) as avg_bid_rank
  FROM reverse_auction_bids b
  JOIN reverse_auctions ra ON ra.id = b.auction_id
  GROUP BY b.supplier_id
  ORDER BY wins DESC, win_rate DESC
  LIMIT 20;
END;
$$;
