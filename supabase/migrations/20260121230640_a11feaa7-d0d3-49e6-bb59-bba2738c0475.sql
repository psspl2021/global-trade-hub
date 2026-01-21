-- Prevent awarding a bid that is already in a terminal state
CREATE OR REPLACE FUNCTION public.prevent_award_on_closed_bid()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status::text IN ('closed','expired','withdrawn') AND NEW.status = 'accepted' THEN
    RAISE EXCEPTION 'Cannot award a closed or expired bid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_award_on_closed_bid_trigger ON public.bids;
CREATE TRIGGER prevent_award_on_closed_bid_trigger
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.prevent_award_on_closed_bid();

-- Same for logistics_bids
CREATE OR REPLACE FUNCTION public.prevent_award_on_closed_logistics_bid()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status::text IN ('closed','expired','withdrawn') AND NEW.status = 'accepted' THEN
    RAISE EXCEPTION 'Cannot award a closed or expired logistics bid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_award_on_closed_logistics_bid_trigger ON public.logistics_bids;
CREATE TRIGGER prevent_award_on_closed_logistics_bid_trigger
BEFORE UPDATE ON public.logistics_bids
FOR EACH ROW
EXECUTE FUNCTION public.prevent_award_on_closed_logistics_bid();