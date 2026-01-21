-- Update bids trigger to handle all terminal states
CREATE OR REPLACE FUNCTION public.set_bid_status_timestamps()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' 
     AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'accepted') THEN
    NEW.awarded_at := COALESCE(NEW.awarded_at, now());

  ELSIF NEW.status = 'rejected' 
     AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.rejected_at := COALESCE(NEW.rejected_at, now());

  ELSIF NEW.status::text IN ('withdrawn', 'closed', 'expired') 
     AND (OLD.status IS NULL OR OLD.status::text NOT IN ('withdrawn','closed','expired')) THEN
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  END IF;

  RETURN NEW;
END;
$$;

-- Update logistics_bids trigger to handle all terminal states
CREATE OR REPLACE FUNCTION public.set_logistics_bid_status_timestamps()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' 
     AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'accepted') THEN
    NEW.awarded_at := COALESCE(NEW.awarded_at, now());

  ELSIF NEW.status = 'rejected' 
     AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.rejected_at := COALESCE(NEW.rejected_at, now());

  ELSIF NEW.status::text IN ('withdrawn', 'closed', 'expired') 
     AND (OLD.status IS NULL OR OLD.status::text NOT IN ('withdrawn','closed','expired')) THEN
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  END IF;

  RETURN NEW;
END;
$$;