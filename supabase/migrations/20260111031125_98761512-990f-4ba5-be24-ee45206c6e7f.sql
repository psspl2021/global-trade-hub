-- =============================================
-- FIX 1: Correct CHECK constraint syntax for NULL handling
-- =============================================

-- Fix ai_seo_settings company_role constraint
ALTER TABLE ai_seo_settings
DROP CONSTRAINT IF EXISTS ai_seo_settings_company_role_check;

ALTER TABLE ai_seo_settings
ADD CONSTRAINT ai_seo_settings_company_role_valid
CHECK (
  company_role IS NULL
  OR company_role IN ('buyer', 'supplier', 'hybrid')
);

-- Fix ai_sem_settings company_role constraint
ALTER TABLE ai_sem_settings
DROP CONSTRAINT IF EXISTS ai_sem_settings_company_role_check;

ALTER TABLE ai_sem_settings
ADD CONSTRAINT ai_sem_settings_company_role_valid
CHECK (
  company_role IS NULL
  OR company_role IN ('buyer', 'supplier', 'hybrid')
);

-- =============================================
-- FIX 2: Singleton guard for settings tables
-- =============================================

-- Ensure only one row can exist in ai_seo_settings
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ai_seo_settings_singleton
ON ai_seo_settings ((true));

-- Ensure only one row can exist in ai_sem_settings
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ai_sem_settings_singleton
ON ai_sem_settings ((true));