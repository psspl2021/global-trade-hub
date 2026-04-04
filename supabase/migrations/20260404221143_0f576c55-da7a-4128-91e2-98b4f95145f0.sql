
-- Chat messages table
CREATE TABLE IF NOT EXISTS public.auction_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('buyer', 'supplier', 'system')),
  message text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'counter_offer', 'system')),
  counter_price numeric,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Counter offers table
CREATE TABLE IF NOT EXISTS public.auction_counter_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  original_bid_price numeric,
  counter_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  response_message text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.auction_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_counter_offers ENABLE ROW LEVEL SECURITY;

-- Messages: participants can read
CREATE POLICY "Auction participants can view messages"
ON public.auction_messages FOR SELECT TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.reverse_auctions ra WHERE ra.id = auction_id AND ra.buyer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.reverse_auction_suppliers ras
    WHERE ras.auction_id = auction_messages.auction_id
    AND (ras.supplier_id = auth.uid() OR ras.supplier_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
  )
);

-- Messages: authenticated can insert their own
CREATE POLICY "Users can send messages"
ON public.auction_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Counter offers: buyer and supplier can view their own
CREATE POLICY "Participants can view counter offers"
ON public.auction_counter_offers FOR SELECT TO authenticated
USING (supplier_id = auth.uid() OR buyer_id = auth.uid());

-- Counter offers: suppliers can create
CREATE POLICY "Suppliers can create counter offers"
ON public.auction_counter_offers FOR INSERT TO authenticated
WITH CHECK (supplier_id = auth.uid());

-- Counter offers: buyers can update status (accept/reject)
CREATE POLICY "Buyers can respond to counter offers"
ON public.auction_counter_offers FOR UPDATE TO authenticated
USING (buyer_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_counter_offers;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_auction_messages_auction_id ON public.auction_messages(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_counter_offers_auction_id ON public.auction_counter_offers(auction_id);
