-- Add dispatched_qty column to bid_items for tracking per-item dispatch quantities
ALTER TABLE public.bid_items 
ADD COLUMN IF NOT EXISTS dispatched_qty numeric DEFAULT 0;