-- Make the trigger no-op when the dropped table is missing, to fix login 500 error
CREATE OR REPLACE FUNCTION public.cleanup_temp_credentials_on_signin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.last_sign_in_at IS NOT NULL
     AND (OLD.last_sign_in_at IS NULL OR OLD.last_sign_in_at <> NEW.last_sign_in_at) THEN
    IF to_regclass('public.purchaser_temp_credentials') IS NOT NULL THEN
      EXECUTE 'DELETE FROM public.purchaser_temp_credentials WHERE user_id = $1' USING NEW.id;
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block login on cleanup failure
  RETURN NEW;
END;
$function$;