-- ============================================================
-- MIGRATION 1: ADD BUYER SUB-ROLES ENUM VALUES
-- ============================================================
-- New roles for buyer dashboard separation
-- ============================================================

-- Add new enum values (commit before use)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'buyer_purchaser';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'buyer_cfo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'buyer_ceo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'buyer_manager';