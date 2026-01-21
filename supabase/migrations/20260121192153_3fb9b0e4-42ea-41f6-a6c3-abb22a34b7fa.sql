-- Recreate views using text cast to handle current + future statuses
DROP VIEW IF EXISTS public.bids_with_display_date;
DROP VIEW IF EXISTS public.logistics_bids_with_display_date;

CREATE VIEW public.bids_with_display_date 
WITH (security_invoker = true) AS
SELECT
  b.*,
  CASE
    WHEN b.status = 'accepted' THEN b.awarded_at
    WHEN b.status = 'rejected' THEN b.rejected_at
    WHEN b.status::text IN ('withdrawn','closed','expired') THEN b.closed_at
    ELSE b.created_at
  END AS display_date
FROM public.bids b;

CREATE VIEW public.logistics_bids_with_display_date 
WITH (security_invoker = true) AS
SELECT
  b.*,
  CASE
    WHEN b.status = 'accepted' THEN b.awarded_at
    WHEN b.status = 'rejected' THEN b.rejected_at
    WHEN b.status::text IN ('withdrawn','closed','expired') THEN b.closed_at
    ELSE b.created_at
  END AS display_date
FROM public.logistics_bids b;

-- Performance indexes for sorting/filtering by status + lifecycle dates
CREATE INDEX IF NOT EXISTS idx_bids_status_dates
ON public.bids(status, awarded_at, rejected_at, closed_at, created_at);

CREATE INDEX IF NOT EXISTS idx_logistics_bids_status_dates
ON public.logistics_bids(status, awarded_at, rejected_at, closed_at, created_at);