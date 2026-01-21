-- Create view for bids with display_date
CREATE OR REPLACE VIEW public.bids_with_display_date AS
SELECT
  b.*,
  CASE
    WHEN b.status = 'accepted' THEN b.awarded_at
    WHEN b.status = 'rejected' THEN b.rejected_at
    WHEN b.status = 'withdrawn' THEN b.closed_at
    ELSE b.created_at
  END AS display_date
FROM public.bids b;

-- Create view for logistics_bids with display_date
CREATE OR REPLACE VIEW public.logistics_bids_with_display_date AS
SELECT
  b.*,
  CASE
    WHEN b.status = 'accepted' THEN b.awarded_at
    WHEN b.status = 'rejected' THEN b.rejected_at
    ELSE b.created_at
  END AS display_date
FROM public.logistics_bids b;