-- Remove persistent temp-credential storage (security hardening).
-- Temp passwords are returned ONCE at creation time only.

DROP FUNCTION IF EXISTS public.get_visible_temp_credentials(uuid);
DROP TABLE IF EXISTS public.purchaser_temp_credentials;