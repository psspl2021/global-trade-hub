-- Step 1: Add 'withdrawn' to bid_status enum for future-proofing
ALTER TYPE bid_status ADD VALUE IF NOT EXISTS 'withdrawn';