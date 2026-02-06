-- ============================================================
-- FINAL GOVERNANCE & BILLING LOCK - PART 1: ENUM EXTENSION
-- ============================================================
-- Add new governance roles to the existing app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'purchaser';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cfo';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ceo';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'external_guest';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ps_admin';