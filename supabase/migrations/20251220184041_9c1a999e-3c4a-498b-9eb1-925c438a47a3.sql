-- Create function to send email notifications via edge function
CREATE OR REPLACE FUNCTION public.send_email_notification(
  p_to TEXT,
  p_subject TEXT,
  p_type TEXT,
  p_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Get the Supabase URL and service role key from environment
  v_url := 'https://hsybhjjtxdwtpfvcmoqk.supabase.co/functions/v1/send-notification-email';
  
  -- Make HTTP request to edge function using pg_net
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'to', p_to,
      'subject', p_subject,
      'type', p_type,
      'data', p_data
    )
  );
END;
$$;

-- Update notify_buyer_on_bid to also send email
CREATE OR REPLACE FUNCTION public.notify_buyer_on_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Create in-app notification for buyer
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_requirement.buyer_id,
    'new_bid',
    'New Bid Received',
    'You received a new bid of ₹' || NEW.total_amount || ' from ' || COALESCE(v_supplier_profile.company_name, 'a supplier') || ' for "' || v_requirement.title || '"',
    jsonb_build_object('bid_id', NEW.id, 'requirement_id', NEW.requirement_id, 'supplier_id', NEW.supplier_id)
  );
  
  -- Send email notification
  PERFORM send_email_notification(
    v_buyer_profile.email,
    'New Bid Received on ' || v_requirement.title,
    'new_bid',
    jsonb_build_object(
      'requirement_title', v_requirement.title,
      'bid_amount', NEW.total_amount,
      'supplier_name', COALESCE(v_supplier_profile.company_name, 'A supplier'),
      'delivery_days', NEW.delivery_timeline_days
    )
  );
  
  RETURN NEW;
END;
$$;

-- Update notify_suppliers_on_requirement to also send email
CREATE OR REPLACE FUNCTION public.notify_suppliers_on_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier RECORD;
  v_buyer_profile profiles%ROWTYPE;
BEGIN
  -- Get buyer profile
  SELECT * INTO v_buyer_profile FROM profiles WHERE id = NEW.buyer_id;
  
  -- Find suppliers whose categories match the requirement category
  FOR v_supplier IN 
    SELECT p.id, p.company_name, p.email 
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'supplier'
    AND p.supplier_categories IS NOT NULL
    AND NEW.product_category = ANY(p.supplier_categories)
    AND p.id != NEW.buyer_id
  LOOP
    -- Create in-app notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      v_supplier.id,
      'new_requirement',
      'New Requirement in Your Category',
      'A new requirement "' || NEW.title || '" for ' || NEW.product_category || ' has been posted by ' || COALESCE(v_buyer_profile.company_name, 'a buyer'),
      jsonb_build_object('requirement_id', NEW.id, 'category', NEW.product_category)
    );
    
    -- Send email notification
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
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Update notify_partner_on_document_verified to also send email
CREATE OR REPLACE FUNCTION public.notify_partner_on_document_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_profile profiles%ROWTYPE;
BEGIN
  -- Only notify when status changes to verified
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
    -- Get partner profile for email
    SELECT * INTO v_partner_profile FROM profiles WHERE id = NEW.partner_id;
    
    -- Create in-app notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.partner_id,
      'document_verified',
      'Document Verified',
      'Your ' || NEW.document_type || ' document has been verified successfully.',
      jsonb_build_object('document_id', NEW.id, 'document_type', NEW.document_type)
    );
    
    -- Send email notification
    PERFORM send_email_notification(
      v_partner_profile.email,
      'Document Verified Successfully',
      'document_verified',
      jsonb_build_object('document_type', NEW.document_type)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update notify_logistics_partners_on_requirement to also send email
CREATE OR REPLACE FUNCTION public.notify_logistics_partners_on_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    -- Send email notification
    PERFORM send_email_notification(
      v_partner.email,
      'New Logistics Requirement: ' || NEW.title,
      'new_logistics_requirement',
      jsonb_build_object(
        'requirement_title', NEW.title,
        'pickup_location', NEW.pickup_location,
        'delivery_location', NEW.delivery_location,
        'material_type', NEW.material_type,
        'quantity', NEW.quantity,
        'unit', NEW.unit
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Update handle_referral_reward to also send email
CREATE OR REPLACE FUNCTION public.handle_referral_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_referrer_profile profiles%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Check if this supplier was referred and reward not yet credited
    SELECT * INTO v_referral 
    FROM referrals 
    WHERE referred_id = NEW.supplier_id 
      AND status = 'signed_up' 
      AND reward_credited = FALSE
    LIMIT 1;
    
    IF FOUND THEN
      -- Get referrer profile for email
      SELECT * INTO v_referrer_profile FROM profiles WHERE id = v_referral.referrer_id;
      
      -- Credit referrer with +1 premium bid
      UPDATE subscriptions 
      SET premium_bids_balance = premium_bids_balance + 1,
          updated_at = NOW()
      WHERE user_id = v_referral.referrer_id;
      
      -- Update referral status
      UPDATE referrals 
      SET status = 'rewarded',
          reward_credited = TRUE,
          rewarded_at = NOW()
      WHERE id = v_referral.id;
      
      -- Create in-app notification for referrer
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        v_referral.referrer_id,
        'referral_reward',
        'Referral Reward Earned!',
        'You earned 1 free bid! Your referred user just had their bid accepted.',
        jsonb_build_object('referral_id', v_referral.id, 'referred_id', NEW.supplier_id)
      );
      
      -- Send email notification
      PERFORM send_email_notification(
        v_referrer_profile.email,
        'You Earned a Referral Reward!',
        'referral_reward',
        jsonb_build_object('reward', '1 Free Premium Bid')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;