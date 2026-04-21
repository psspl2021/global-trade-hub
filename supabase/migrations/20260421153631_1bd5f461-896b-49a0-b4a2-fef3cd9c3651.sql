ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS base_currency text NOT NULL DEFAULT 'INR';

UPDATE public.requirements SET currency = COALESCE(currency, 'INR'), base_currency = COALESCE(base_currency, 'INR');

CREATE INDEX IF NOT EXISTS idx_requirements_currency ON public.requirements(currency) WHERE currency <> 'INR';