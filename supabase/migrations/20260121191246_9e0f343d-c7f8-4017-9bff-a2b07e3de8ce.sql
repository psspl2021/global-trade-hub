-- Fix views to use SECURITY INVOKER (respects RLS of querying user)
DROP VIEW IF EXISTS public.bids_with_display_date;
DROP VIEW IF EXISTS public.logistics_bids_with_display_date;

-- Recreate with SECURITY INVOKER
CREATE VIEW public.bids_with_display_date 
WITH (security_invoker = true) AS
SELECT
  b.*,
  CASE
    WHEN b.status = 'accepted' THEN b.awarded_at
    WHEN b.status = 'rejected' THEN b.rejected_at
    WHEN b.status = 'withdrawn' THEN b.closed_at
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
    ELSE b.created_at
  END AS display_date
FROM public.logistics_bids b;

-- Also fix the trigger functions with proper search_path
CREATE OR REPLACE FUNCTION public.set_bid_status_timestamps()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'accepted') THEN
    NEW.awarded_at := COALESCE(NEW.awarded_at, now());
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.rejected_at := COALESCE(NEW.rejected_at, now());
  ELSIF NEW.status = 'withdrawn' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'withdrawn') THEN
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_logistics_bid_status_timestamps()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'accepted') THEN
    NEW.awarded_at := COALESCE(NEW.awarded_at, now());
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.rejected_at := COALESCE(NEW.rejected_at, now());
  END IF;
  RETURN NEW;
END;
$$;