CREATE OR REPLACE FUNCTION public.calculate_bid_item_line_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.total := NEW.supplier_unit_price * NEW.quantity;
  RETURN NEW;
END;
$function$;