-- Add bank details columns to profiles table for affiliate payouts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;