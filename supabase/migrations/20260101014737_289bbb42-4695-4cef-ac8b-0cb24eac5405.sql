-- Update notify_buyer_on_bid to pass buyer_id for email tracking
CREATE OR REPLACE FUNCTION public.notify_buyer_on_bid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Send email notification to buyer with buyer_id for tracking
  PERFORM net.http_post(
    url := 'https://hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'to', v_buyer_profile.email,
      'subject', 'New Bid Received on ' || v_requirement.title,
      'type', 'new_bid',
      'data', jsonb_build_object(
        'requirement_title', v_requirement.title,
        'bid_amount', ROUND(COALESCE(v_rate_per_unit, NEW.bid_amount), 2),
        'unit', v_unit,
        'supplier_name', 'ProcureSaathi Solutions'
      ),
      'buyer_id', v_requirement.buyer_id,
      'requirement_id', NEW.requirement_id
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Update notify_logistics_partners_on_requirement to pass logistics_partner_id for email tracking
CREATE OR REPLACE FUNCTION public.notify_logistics_partners_on_requirement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_partner RECORD;
  v_customer_profile profiles%ROWTYPE;
BEGIN
  -- Get customer profile
  SELECT * INTO v_customer_profile FROM profiles WHERE id = NEW.customer_id;
  
  -- Find logistics partners with matching routes
  FOR v_partner IN 
    SELECT DISTINCT p.id, p.company_name, p.email 
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    JOIN vehicles v ON v.partner_id = p.id
    WHERE ur.role = 'logistics_partner'
    AND v.verification_status = 'verified'
    AND p.id != NEW.customer_id
    AND (
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(v.routes) AS route
        WHERE 
          LOWER(route->>'from') LIKE '%' || LOWER(SPLIT_PART(NEW.pickup_location, ',', 1)) || '%'
          OR LOWER(route->>'to') LIKE '%' || LOWER(SPLIT_PART(NEW.delivery_location, ',', 1)) || '%'
          OR LOWER(route->>'from') LIKE '%' || LOWER(SPLIT_PART(NEW.delivery_location, ',', 1)) || '%'
          OR LOWER(route->>'to') LIKE '%' || LOWER(SPLIT_PART(NEW.pickup_location, ',', 1)) || '%'
      )
    )
  LOOP
    -- Create in-app notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      v_partner.id,
      'new_logistics_requirement',
      'New Logistics Requirement on Your Route',
      'A new logistics requirement "' || NEW.title || '" from ' || NEW.pickup_location || ' to ' || NEW.delivery_location || ' has been posted.',
      jsonb_build_object('logistics_requirement_id', NEW.id, 'pickup', NEW.pickup_location, 'delivery', NEW.delivery_location)
    );
    
    -- Send email notification with logistics_partner_id for tracking
    PERFORM net.http_post(
      url := 'https://hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'to', v_partner.email,
        'subject', 'New Logistics Requirement: ' || NEW.title,
        'type', 'new_logistics_requirement',
        'data', jsonb_build_object(
          'requirement_title', NEW.title,
          'pickup_location', NEW.pickup_location,
          'delivery_location', NEW.delivery_location,
          'material_type', NEW.material_type,
          'quantity', NEW.quantity,
          'unit', NEW.unit
        ),
        'logistics_partner_id', v_partner.id,
        'logistics_requirement_id', NEW.id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;