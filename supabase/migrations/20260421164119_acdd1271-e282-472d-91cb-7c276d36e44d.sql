CREATE OR REPLACE FUNCTION public.po_autofill_currency_fx()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_req_currency TEXT;
  v_auc_currency TEXT;
  v_fx_rate NUMERIC;
  v_fx_source TEXT;
  v_fx_ts TIMESTAMPTZ;
  v_resolved TEXT;
  v_lookup TEXT;
BEGIN
  -- Always try to resolve from linked requirement / auction first.
  -- This covers the common case where the PO currency column has its INR default
  -- but the upstream RFQ is actually international.
  IF NEW.requirement_id IS NOT NULL THEN
    SELECT currency INTO v_req_currency FROM requirements WHERE id = NEW.requirement_id;
  END IF;
  IF NEW.auction_id IS NOT NULL THEN
    SELECT currency INTO v_auc_currency FROM reverse_auctions WHERE id = NEW.auction_id;
  END IF;
  v_lookup := COALESCE(NULLIF(v_req_currency,''), NULLIF(v_auc_currency,''));

  -- Caller-supplied non-INR currency wins; otherwise prefer upstream lookup; otherwise keep what was given (default INR).
  IF NEW.currency IS NOT NULL AND NEW.currency <> '' AND NEW.currency <> 'INR' THEN
    v_resolved := NEW.currency;
  ELSIF v_lookup IS NOT NULL THEN
    v_resolved := v_lookup;
  ELSE
    v_resolved := COALESCE(NEW.currency, 'INR');
  END IF;

  NEW.currency := v_resolved;

  IF NEW.base_currency IS NULL OR NEW.base_currency = '' THEN
    NEW.base_currency := 'INR';
  END IF;

  -- FX snapshot — re-fill if we re-resolved the currency above
  IF v_resolved = 'INR' THEN
    v_fx_rate := 1; v_fx_source := 'identity'; v_fx_ts := now();
  ELSE
    SELECT rate_to_inr, source, COALESCE(updated_at, fetched_at)
      INTO v_fx_rate, v_fx_source, v_fx_ts
    FROM fx_rates WHERE currency_code = v_resolved
    ORDER BY COALESCE(updated_at, fetched_at) DESC LIMIT 1;
    IF v_fx_rate IS NULL THEN
      v_fx_rate := 1; v_fx_source := 'unavailable'; v_fx_ts := now();
    END IF;
  END IF;

  -- Always overwrite FX when we resolved a non-default currency from upstream
  IF NEW.exchange_rate IS NULL OR NEW.fx_source IS NULL OR NEW.fx_timestamp IS NULL OR (v_lookup IS NOT NULL AND v_lookup <> 'INR') THEN
    NEW.exchange_rate := v_fx_rate;
    NEW.fx_source := v_fx_source;
    NEW.fx_timestamp := v_fx_ts;
  END IF;

  IF NEW.po_value IS NOT NULL THEN
    NEW.po_value_base_currency := NEW.po_value * COALESCE(NEW.exchange_rate, 1);
  END IF;

  IF (NEW.incoterms IS NULL OR NEW.incoterms = '') AND NEW.requirement_id IS NOT NULL THEN
    SELECT incoterms INTO NEW.incoterms FROM requirements WHERE id = NEW.requirement_id;
  END IF;

  IF NEW.region_type IS NULL OR NEW.region_type = '' OR NEW.region_type = 'india' THEN
    NEW.region_type := CASE WHEN COALESCE(NEW.currency, 'INR') <> 'INR' THEN 'global' ELSE 'india' END;
  END IF;

  RETURN NEW;
END;
$$;