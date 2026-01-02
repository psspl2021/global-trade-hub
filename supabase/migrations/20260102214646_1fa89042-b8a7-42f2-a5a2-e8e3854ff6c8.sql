-- Add dispatched_qty column to bids table for suppliers to track actual delivered quantity
ALTER TABLE public.bids 
ADD COLUMN dispatched_qty numeric DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.bids.dispatched_qty IS 'Actual quantity dispatched/delivered by supplier';