-- Add referred_by fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by_name text,
ADD COLUMN IF NOT EXISTS referred_by_phone text;