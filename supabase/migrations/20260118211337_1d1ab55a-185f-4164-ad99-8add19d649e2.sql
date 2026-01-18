-- ✅ (A) Enforce single-row invariant - prevents accidental duplicate configs
CREATE UNIQUE INDEX one_margin_settings_row
ON public.margin_settings ((true));

-- ✅ (B) Explicit SELECT policy for clarity and audit trail
-- First drop the existing "for all" policy and create separate policies
DROP POLICY IF EXISTS "Admin only access" ON public.margin_settings;

CREATE POLICY "Admin read margin settings"
ON public.margin_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.business_type = 'admin'
  )
);

CREATE POLICY "Admin update margin settings"
ON public.margin_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.business_type = 'admin'
  )
);

-- No INSERT/DELETE policies - margin row is pre-seeded, never deleted