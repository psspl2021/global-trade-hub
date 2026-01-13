-- Add missing award_coverage_percentage column to bids table
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS award_coverage_percentage NUMERIC 
  CHECK (award_coverage_percentage IS NULL OR (award_coverage_percentage > 0 AND award_coverage_percentage <= 100));