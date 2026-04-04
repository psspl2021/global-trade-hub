
ALTER TABLE public.reverse_auctions
  ADD COLUMN IF NOT EXISTS target_savings_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_bids_per_supplier integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS show_exact_prices boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_rank_only boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_auto_extensions integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS auto_extensions_used integer DEFAULT 0;
