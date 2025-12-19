-- Add yard_location column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS yard_location text;