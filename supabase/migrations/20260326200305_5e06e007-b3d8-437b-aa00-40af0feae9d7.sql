ALTER TABLE public.reverse_auction_suppliers 
ADD COLUMN IF NOT EXISTS invite_status text NOT NULL DEFAULT 'sent';