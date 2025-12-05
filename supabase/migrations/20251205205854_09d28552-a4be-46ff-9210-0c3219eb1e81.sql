-- Add logistics_partner to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'logistics_partner';