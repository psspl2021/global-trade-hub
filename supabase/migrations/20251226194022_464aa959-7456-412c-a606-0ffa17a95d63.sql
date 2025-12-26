-- Add email notification preference column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Update the notify_suppliers_on_requirement function to check preference
CREATE OR REPLACE FUNCTION public.notify_suppliers_on_requirement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supplier RECORD;
  v_buyer_profile profiles%ROWTYPE;
BEGIN
  -- Get buyer profile
  SELECT * INTO v_buyer_profile FROM profiles WHERE id = NEW.buyer_id;
  
  -- Find suppliers whose categories match the requirement category AND have email notifications enabled
  FOR v_supplier IN 
    SELECT p.id, p.company_name, p.email, p.email_notifications_enabled
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'supplier'
    AND p.supplier_categories IS NOT NULL
    AND NEW.product_category = ANY(p.supplier_categories)
    AND p.id != NEW.buyer_id
  LOOP
    -- Create in-app notification for all matching suppliers
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      v_supplier.id,
      'new_requirement',
      'New Requirement in Your Category',
      'A new requirement "' || NEW.title || '" for ' || NEW.product_category || ' has been posted by ' || COALESCE(v_buyer_profile.company_name, 'a buyer'),
      jsonb_build_object('requirement_id', NEW.id, 'category', NEW.product_category)
    );
    
    -- Send email notification ONLY if supplier has enabled email notifications
    IF v_supplier.email_notifications_enabled = true THEN
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
          'deadline', NEW.deadline
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;