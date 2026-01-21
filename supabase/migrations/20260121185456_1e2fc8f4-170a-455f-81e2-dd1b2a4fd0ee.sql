-- Add timestamp columns for bid status tracking
-- Note: bids table already has approved_at for accepted status, so we rename it to awarded_at and add others

-- Add rejected_at and closed_at columns to bids table
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Rename approved_at to awarded_at if it exists (for clarity)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'approved_at') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'awarded_at') THEN
    ALTER TABLE public.bids RENAME COLUMN approved_at TO awarded_at;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bids' AND column_name = 'awarded_at') THEN
    ALTER TABLE public.bids ADD COLUMN awarded_at timestamptz;
  END IF;
END $$;

-- Add same columns to logistics_bids table
ALTER TABLE public.logistics_bids
ADD COLUMN IF NOT EXISTS awarded_at timestamptz,
ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Create trigger function for bids table to auto-set timestamps on status change
CREATE OR REPLACE FUNCTION public.set_bid_status_timestamps()
RETURNS trigger AS $$
BEGIN
  -- Set awarded_at when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'accepted') THEN
    NEW.awarded_at := COALESCE(NEW.awarded_at, now());
  END IF;
  
  -- Set rejected_at when status changes to 'rejected'
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.rejected_at := COALESCE(NEW.rejected_at, now());
  END IF;
  
  -- Set closed_at when status changes to 'closed' or 'expired'
  IF NEW.status IN ('closed', 'expired') AND (OLD.status IS NULL OR OLD.status NOT IN ('closed', 'expired')) THEN
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bids table
DROP TRIGGER IF EXISTS set_bid_status_timestamps_trigger ON public.bids;
CREATE TRIGGER set_bid_status_timestamps_trigger
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.set_bid_status_timestamps();

-- Create trigger for logistics_bids table
DROP TRIGGER IF EXISTS set_logistics_bid_status_timestamps_trigger ON public.logistics_bids;
CREATE TRIGGER set_logistics_bid_status_timestamps_trigger
BEFORE UPDATE ON public.logistics_bids
FOR EACH ROW
EXECUTE FUNCTION public.set_bid_status_timestamps();