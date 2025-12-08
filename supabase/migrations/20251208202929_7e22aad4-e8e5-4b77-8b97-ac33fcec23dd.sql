-- Add rate_per_unit column to logistics_bids for historical reference
ALTER TABLE public.logistics_bids 
ADD COLUMN rate_per_unit numeric;