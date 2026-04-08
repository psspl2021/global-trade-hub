ALTER TABLE public.supplier_participation
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;