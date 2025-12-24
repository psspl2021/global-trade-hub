
-- Update the notify_buyer_on_bid function to use ProcureSaathi Solutions instead of supplier name
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
BEGIN
  -- Get requirement details
  SELECT * INTO v_requirement FROM requirements WHERE id = NEW.requirement_id;
  
  -- Get supplier profile
  SELECT * INTO v_supplier_profile FROM profiles WHERE id = NEW.supplier_id;
  
  -- Get buyer profile for email
  SELECT * INTO v_buyer_profile FROM profiles WHERE id = v_requirement.buyer_id;
  
  -- Create in-app notification for buyer (using ProcureSaathi Solutions instead of supplier name)
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_requirement.buyer_id,
    'new_bid',
    'New Bid Received',
    'You received a new bid of ₹' || NEW.total_amount || ' from ProcureSaathi Solutions for "' || v_requirement.title || '"',
    jsonb_build_object('bid_id', NEW.id, 'requirement_id', NEW.requirement_id, 'supplier_id', NEW.supplier_id)
  );
  
  -- Send email notification (also using ProcureSaathi Solutions)
  PERFORM send_email_notification(
    v_buyer_profile.email,
    'New Bid Received on ' || v_requirement.title,
    'new_bid',
    jsonb_build_object(
      'requirement_title', v_requirement.title,
      'bid_amount', NEW.total_amount,
      'supplier_name', 'ProcureSaathi Solutions',
      'delivery_days', NEW.delivery_timeline_days
    )
  );
  
  RETURN NEW;
END;
$function$;
