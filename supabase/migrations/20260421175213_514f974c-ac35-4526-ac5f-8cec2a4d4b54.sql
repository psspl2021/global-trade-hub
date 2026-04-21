CREATE OR REPLACE FUNCTION public._trigger_auto_build_po(p_auction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text := 'https://hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/auto-build-po-from-auction';
BEGIN
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('auction_id', p_auction_id)
  );
EXCEPTION WHEN OTHERS THEN
  -- Never block the auction update if the HTTP call fails
  RAISE WARNING 'auto-build-po HTTP call failed: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_auction_completed_build_po()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND NEW.winner_supplier_id IS NOT NULL
     AND COALESCE(NEW.enable_po_generation, true) = true
     AND (
       OLD.status IS DISTINCT FROM NEW.status
       OR OLD.winner_supplier_id IS DISTINCT FROM NEW.winner_supplier_id
     )
  THEN
    PERFORM public._trigger_auto_build_po(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auction_completed_build_po ON public.reverse_auctions;
CREATE TRIGGER trg_auction_completed_build_po
AFTER UPDATE ON public.reverse_auctions
FOR EACH ROW
EXECUTE FUNCTION public.on_auction_completed_build_po();