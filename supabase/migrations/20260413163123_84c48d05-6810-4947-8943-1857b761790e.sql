
CREATE OR REPLACE FUNCTION public.enforce_supplier_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Lock the parent auction row to serialize all inserts
  PERFORM 1
  FROM reverse_auctions
  WHERE id = NEW.auction_id
  FOR UPDATE;

  SELECT COUNT(*) INTO v_count
  FROM reverse_auction_suppliers
  WHERE auction_id = NEW.auction_id;

  IF v_count >= 20 THEN
    RAISE EXCEPTION USING
      MESSAGE = 'Supplier limit reached: maximum 20 suppliers per auction',
      ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;
