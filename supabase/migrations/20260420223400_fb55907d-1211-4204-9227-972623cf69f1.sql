ALTER TABLE public.buyer_suppliers
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS location text;