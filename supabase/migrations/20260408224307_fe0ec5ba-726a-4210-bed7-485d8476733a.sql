
-- 1. Add is_onboarded to buyer_suppliers
ALTER TABLE public.buyer_suppliers
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;

-- 2. Auto-onboard trigger
CREATE OR REPLACE FUNCTION public.sync_buyer_supplier_onboard()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles p WHERE lower(p.email) = lower(NEW.email)
  ) THEN
    NEW.is_onboarded = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_buyer_supplier_onboard ON public.buyer_suppliers;
CREATE TRIGGER trg_buyer_supplier_onboard
BEFORE INSERT OR UPDATE OF email ON public.buyer_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.sync_buyer_supplier_onboard();

-- 3. Supplier participation table
CREATE TABLE public.supplier_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  auction_id UUID NOT NULL REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  has_viewed BOOLEAN DEFAULT FALSE,
  has_bid BOOLEAN DEFAULT FALSE,
  bid_count INT DEFAULT 0,
  last_bid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id, auction_id)
);

ALTER TABLE public.supplier_participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their supplier participation"
ON public.supplier_participation FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can insert participation records"
ON public.supplier_participation FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their participation records"
ON public.supplier_participation FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Suppliers can view own participation"
ON public.supplier_participation FOR SELECT
TO authenticated
USING (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can update own participation"
ON public.supplier_participation FOR UPDATE
TO authenticated
USING (auth.uid() = supplier_id);

-- 4. Increment bid count function
CREATE OR REPLACE FUNCTION public.increment_bid_count(sid UUID, aid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.supplier_participation (supplier_id, auction_id, buyer_id, has_bid, bid_count, last_bid_at)
  SELECT sid, aid, ra.buyer_id, TRUE, 1, now()
  FROM public.reverse_auctions ra WHERE ra.id = aid
  ON CONFLICT (supplier_id, auction_id)
  DO UPDATE SET
    bid_count = supplier_participation.bid_count + 1,
    has_bid = TRUE,
    last_bid_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_supplier_participation_supplier ON public.supplier_participation(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_participation_auction ON public.supplier_participation(auction_id);
CREATE INDEX IF NOT EXISTS idx_buyer_suppliers_onboarded ON public.buyer_suppliers(buyer_id, is_onboarded);
