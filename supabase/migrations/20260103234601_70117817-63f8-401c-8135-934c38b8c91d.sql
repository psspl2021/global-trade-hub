CREATE OR REPLACE FUNCTION public.notify_buyer_on_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Use bid_amount as rate per unit (already stored as rate with markup)
  v_rate_per_unit := NEW.bid_amount;
  
  -- Get unit from requirement
  v_unit := COALESCE(v_requirement.unit, 'Unit');
  
  -- Create in-app notification for buyer showing total buyer visible price
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_requirement.buyer_id,
    'new_bid',
    'New Bid Received',
    'You received a new bid of ₹' || TO_CHAR(NEW.buyer_visible_price, 'FM99,99,99,999') || ' (₹' || ROUND(v_rate_per_unit, 2) || '/' || v_unit || ') from ProcureSaathi Solutions for "' || v_requirement.title || '"',
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
        'bid_amount', NEW.buyer_visible_price,
        'rate_per_unit', ROUND(v_rate_per_unit, 2),
        'unit', v_unit,
        'supplier_name', 'ProcureSaathi Solutions',
        'delivery_days', NEW.delivery_timeline_days
      ),
      'buyer_id', v_requirement.buyer_id,
      'requirement_id', NEW.requirement_id
    )
  );
  
  RETURN NEW;
END;
$$;