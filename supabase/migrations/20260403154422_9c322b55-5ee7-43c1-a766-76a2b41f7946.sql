
CREATE TABLE public.reverse_auction_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_id UUID NOT NULL,
  actor_role TEXT NOT NULL DEFAULT 'supplier',
  bid_id UUID,
  bid_amount NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reverse_auction_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_auction_audit_auction_id ON public.reverse_auction_audit_logs(auction_id);
CREATE INDEX idx_auction_audit_event_type ON public.reverse_auction_audit_logs(event_type);

CREATE POLICY "Authenticated users can insert audit logs"
ON public.reverse_auction_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Buyers can view audit logs for their auctions"
ON public.reverse_auction_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reverse_auctions ra
    WHERE ra.id = reverse_auction_audit_logs.auction_id
    AND ra.buyer_id = auth.uid()
  )
);
