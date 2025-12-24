CREATE OR REPLACE FUNCTION public.notify_buyer_on_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_requirement requirements%ROWTYPE;
  v_supplier_profile profiles%ROWTYPE;
  v_buyer_profile profiles%ROWTYPE;
  v_rate_per_unit NUMERIC;
  v_unit TEXT;
BEGIN
  -- Get requirement details
  SELECT * INTO v_requirement FROM requirements WHERE id = NEW.requirement_id;
  
  -- Get supplier profile
  SELECT * INTO v_supplier_profile FROM profiles WHERE id = NEW.supplier_id;
  
  -- Get buyer profile for email
  SELECT * INTO v_buyer_profile FROM profiles WHERE id = v_requirement.buyer_id;
  
  -- Extract rate per unit from terms_and_conditions if available
  IF NEW.terms_and_conditions IS NOT NULL AND NEW.terms_and_conditions LIKE '%Rate Per Unit:%' THEN
    v_rate_per_unit := NULLIF(
      REGEXP_REPLACE(
        SPLIT_PART(SPLIT_PART(NEW.terms_and_conditions, 'Rate Per Unit: ', 2), ',', 1),
        '[^0-9.]', '', 'g'
      ), ''
    )::NUMERIC;
  ELSE
    -- Fallback: calculate from bid_amount / quantity
    v_rate_per_unit := NEW.bid_amount / NULLIF(v_requirement.quantity, 0);
  END IF;
  
  -- Get unit from requirement
  v_unit := COALESCE(v_requirement.unit, 'Unit');
  
  -- Create in-app notification for buyer (showing rate per unit)
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_requirement.buyer_id,
    'new_bid',
    'New Bid Received',
    'You received a new bid of ₹' || ROUND(COALESCE(v_rate_per_unit, NEW.bid_amount), 2) || '/' || v_unit || ' from ProcureSaathi Solutions for "' || v_requirement.title || '"',
    jsonb_build_object('bid_id', NEW.id, 'requirement_id', NEW.requirement_id, 'supplier_id', NEW.supplier_id)
  );
  
  -- Send email notification (also using ProcureSaathi Solutions)
  PERFORM send_email_notification(
    v_buyer_profile.email,
    'New Bid Received on ' || v_requirement.title,
    'new_bid',
    jsonb_build_object(
      'requirement_title', v_requirement.title,
      'bid_amount', ROUND(COALESCE(v_rate_per_unit, NEW.bid_amount), 2),
      'unit', v_unit,
      'supplier_name', 'ProcureSaathi Solutions'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;