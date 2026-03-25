ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS auction_type text DEFAULT 'rfq';
ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS target_price numeric;
ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS current_lowest_bid numeric;
ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS total_bidders integer DEFAULT 0;