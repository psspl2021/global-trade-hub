
-- Drop and recreate the send_email_notification function with supplier_id and requirement_id parameters
DROP FUNCTION IF EXISTS public.send_email_notification(text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.send_email_notification(
  p_to text, 
  p_subject text, 
  p_type text, 
  p_data jsonb,
  p_supplier_id uuid DEFAULT NULL,
  p_requirement_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_url TEXT;
BEGIN
  v_url := 'https://hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/send-notification-email';
  
  -- Make HTTP request to edge function using pg_net with supplier_id and requirement_id
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'to', p_to,
      'subject', p_subject,
      'type', p_type,
      'data', p_data,
      'supplier_id', p_supplier_id,
      'requirement_id', p_requirement_id
    )
  );
END;
$function$;

-- Update notify_suppliers_on_requirement to pass supplier_id and requirement_id
CREATE OR REPLACE FUNCTION public.notify_suppliers_on_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_supplier RECORD;
  v_buyer_profile profiles%ROWTYPE;
  v_item_names TEXT;
  v_should_notify BOOLEAN;
BEGIN
  -- Get buyer profile
  SELECT * INTO v_buyer_profile FROM profiles WHERE id = NEW.buyer_id;
  
  -- Get item names for the requirement
  SELECT string_agg(item_name, ', ') INTO v_item_names
  FROM requirement_items
  WHERE requirement_id = NEW.id;
  
  -- Find suppliers whose categories match the requirement category AND have email notifications enabled
  FOR v_supplier IN 
    SELECT p.id, p.company_name, p.email, p.email_notifications_enabled, 
           p.supplier_categories, p.supplier_notification_subcategories
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'supplier'
    AND p.supplier_categories IS NOT NULL
    AND NEW.product_category = ANY(p.supplier_categories)
    AND p.id != NEW.buyer_id
  LOOP
    -- Determine if we should notify based on subcategory preferences
    v_should_notify := true;
    
    -- If supplier has specific subcategory preferences, check if requirement matches
    IF v_supplier.supplier_notification_subcategories IS NOT NULL 
       AND array_length(v_supplier.supplier_notification_subcategories, 1) > 0 THEN
      -- Check if requirement title or description contains any preferred subcategory
      v_should_notify := false;
      FOR i IN 1..array_length(v_supplier.supplier_notification_subcategories, 1) LOOP
        IF LOWER(NEW.title) LIKE '%' || LOWER(v_supplier.supplier_notification_subcategories[i]) || '%'
           OR LOWER(NEW.description) LIKE '%' || LOWER(v_supplier.supplier_notification_subcategories[i]) || '%'
           OR (v_item_names IS NOT NULL AND LOWER(v_item_names) LIKE '%' || LOWER(v_supplier.supplier_notification_subcategories[i]) || '%') THEN
          v_should_notify := true;
          EXIT;
        END IF;
      END LOOP;
    END IF;
    
    -- Create in-app notification for all matching suppliers (always)
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      v_supplier.id,
      'new_requirement',
      'New Requirement in Your Category',
      'A new requirement "' || NEW.title || '" for ' || NEW.product_category || ' has been posted by ' || COALESCE(v_buyer_profile.company_name, 'a buyer'),
      jsonb_build_object('requirement_id', NEW.id, 'category', NEW.product_category)
    );
    
    -- Send email notification ONLY if:
    -- 1. Supplier has enabled email notifications
    -- 2. Requirement matches their subcategory preferences (or they have no subcategory preferences)
    IF v_supplier.email_notifications_enabled = true AND v_should_notify = true THEN
      PERFORM send_email_notification(
        v_supplier.email,
        'New Requirement: ' || NEW.title,
        'new_requirement',
        jsonb_build_object(
          'requirement_title', NEW.title,
          'category', NEW.product_category,
          'quantity', NEW.quantity,
          'unit', NEW.unit,
          'location', NEW.delivery_location,
          'deadline', NEW.deadline,
          'items', COALESCE(v_item_names, NEW.title),
          'requirement_id', NEW.id
        ),
        v_supplier.id,  -- Pass supplier_id for logging
        NEW.id          -- Pass requirement_id for logging
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Update notify_buyer_on_bid to pass supplier_id
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
    ),
    NEW.supplier_id,      -- Pass supplier_id for logging
    NEW.requirement_id    -- Pass requirement_id for logging
  );
  
  RETURN NEW;
END;
$function$;
