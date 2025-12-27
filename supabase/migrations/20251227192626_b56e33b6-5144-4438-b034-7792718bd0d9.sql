-- Drop and recreate the notify_suppliers_on_requirement function with subcategory matching
CREATE OR REPLACE FUNCTION public.notify_suppliers_on_requirement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supplier RECORD;
  v_buyer_profile profiles%ROWTYPE;
  v_requirement_items requirement_items[];
  v_item_names TEXT;
  v_subcategory TEXT;
  v_should_notify BOOLEAN;
BEGIN
  -- Get buyer profile
  SELECT * INTO v_buyer_profile FROM profiles WHERE id = NEW.buyer_id;
  
  -- Get item names for the requirement
  SELECT string_agg(item_name, ', ') INTO v_item_names
  FROM requirement_items
  WHERE requirement_id = NEW.id;
  
  -- Get first item's description to check for subcategory match
  SELECT description INTO v_subcategory
  FROM requirement_items
  WHERE requirement_id = NEW.id
  LIMIT 1;
  
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
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;