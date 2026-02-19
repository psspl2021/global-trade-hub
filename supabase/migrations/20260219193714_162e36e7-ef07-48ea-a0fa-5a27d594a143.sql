
ALTER TABLE public.seo_demand_pages
ADD COLUMN IF NOT EXISTS gsc_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checked timestamptz;
