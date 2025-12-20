-- 1. Trigger: Notify buyer when they receive a bid
CREATE OR REPLACE FUNCTION public.notify_buyer_on_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_requirement requirements%ROWTYPE;
  v_supplier_profile profiles%ROWTYPE;
BEGIN
  -- Get requirement details
  SELECT * INTO v_requirement FROM requirements WHERE id = NEW.requirement_id;
  
  -- Get supplier profile
  SELECT * INTO v_supplier_profile FROM profiles WHERE id = NEW.supplier_id;
  
  -- Create notification for buyer
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_requirement.buyer_id,
    'new_bid',
    'New Bid Received',
    'You received a new bid of ₹' || NEW.total_amount || ' from ' || COALESCE(v_supplier_profile.company_name, 'a supplier') || ' for "' || v_requirement.title || '"',
    jsonb_build_object('bid_id', NEW.id, 'requirement_id', NEW.requirement_id, 'supplier_id', NEW.supplier_id)
  );
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_bid_created_notify_buyer ON bids;
CREATE TRIGGER on_bid_created_notify_buyer
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_buyer_on_bid();

-- 2. Trigger: Notify suppliers when new requirement matches their categories
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
  
  -- Find suppliers whose categories match the requirement category
  FOR v_supplier IN 
    SELECT p.id, p.company_name 
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'supplier'
    AND p.supplier_categories IS NOT NULL
    AND NEW.product_category = ANY(p.supplier_categories)
    AND p.id != NEW.buyer_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      v_supplier.id,
      'new_requirement',
      'New Requirement in Your Category',
      'A new requirement "' || NEW.title || '" for ' || NEW.product_category || ' has been posted by ' || COALESCE(v_buyer_profile.company_name, 'a buyer'),
      jsonb_build_object('requirement_id', NEW.id, 'category', NEW.product_category)
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_requirement_created_notify_suppliers ON requirements;
CREATE TRIGGER on_requirement_created_notify_suppliers
  AFTER INSERT ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION notify_suppliers_on_requirement();

-- 3. Trigger: Notify logistics partner when documents are verified
CREATE OR REPLACE FUNCTION public.notify_partner_on_document_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify when status changes to verified
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.partner_id,
      'document_verified',
      'Document Verified',
      'Your ' || NEW.document_type || ' document has been verified successfully.',
      jsonb_build_object('document_id', NEW.id, 'document_type', NEW.document_type)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_document_verified_notify_partner ON partner_documents;
CREATE TRIGGER on_document_verified_notify_partner
  AFTER UPDATE ON partner_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_partner_on_document_verified();

-- 4. Trigger: Notify logistics partners when new requirement matches their routes
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
  
  -- Find logistics partners with matching routes (check if pickup or delivery location appears in their routes)
  FOR v_partner IN 
    SELECT DISTINCT p.id, p.company_name 
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    JOIN vehicles v ON v.partner_id = p.id
    WHERE ur.role = 'logistics_partner'
    AND v.verification_status = 'verified'
    AND p.id != NEW.customer_id
    AND (
      -- Check if any route contains pickup or delivery location
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
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      v_partner.id,
      'new_logistics_requirement',
      'New Logistics Requirement on Your Route',
      'A new logistics requirement "' || NEW.title || '" from ' || NEW.pickup_location || ' to ' || NEW.delivery_location || ' has been posted.',
      jsonb_build_object('logistics_requirement_id', NEW.id, 'pickup', NEW.pickup_location, 'delivery', NEW.delivery_location)
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_logistics_requirement_created_notify_partners ON logistics_requirements;
CREATE TRIGGER on_logistics_requirement_created_notify_partners
  AFTER INSERT ON logistics_requirements
  FOR EACH ROW
  EXECUTE FUNCTION notify_logistics_partners_on_requirement();