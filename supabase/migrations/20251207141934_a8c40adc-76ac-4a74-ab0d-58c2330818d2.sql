-- Add is_paid_bid column to bids table
ALTER TABLE bids ADD COLUMN is_paid_bid boolean NOT NULL DEFAULT false;

-- Add is_paid_bid column to logistics_bids table
ALTER TABLE logistics_bids ADD COLUMN is_paid_bid boolean NOT NULL DEFAULT false;

-- Update create_service_fee_invoice function to create additional ₹500 invoice for paid bids
CREATE OR REPLACE FUNCTION public.create_service_fee_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_requirement requirements%ROWTYPE;
  v_trade_type TEXT;
  v_invoice_desc TEXT;
  v_transaction_id UUID;
  v_bid_fee NUMERIC := 500;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    SELECT * INTO v_requirement FROM requirements WHERE id = NEW.requirement_id;
    v_trade_type := COALESCE(v_requirement.trade_type, 'domestic_india');
    
    -- Get transaction ID
    SELECT id INTO v_transaction_id FROM transactions WHERE bid_id = NEW.id LIMIT 1;
    
    -- Determine service fee description based on trade type
    IF v_trade_type = 'domestic_india' THEN
      v_invoice_desc := 'Service Fee - Domestic Trade (0.5%)';
    ELSIF v_trade_type = 'import' THEN
      v_invoice_desc := 'Service Fee - Import Trade (1%)';
    ELSE
      v_invoice_desc := 'Service Fee - Export Trade (1%)';
    END IF;
    
    -- Insert service fee invoice
    INSERT INTO platform_invoices (
      user_id, invoice_type, amount, tax_amount, total_amount,
      description, due_date, related_transaction_id, metadata
    )
    VALUES (
      NEW.supplier_id,
      'service_fee',
      NEW.service_fee,
      ROUND(NEW.service_fee * 0.18, 2),
      ROUND(NEW.service_fee * 1.18, 2),
      v_invoice_desc || ' for Bid #' || SUBSTRING(NEW.id::TEXT, 1, 8),
      CURRENT_DATE + INTERVAL '7 days',
      v_transaction_id,
      jsonb_build_object('bid_id', NEW.id, 'requirement_id', NEW.requirement_id, 'trade_type', v_trade_type)
    );
    
    -- If this was a paid bid (after free tier), create additional ₹500 invoice
    IF NEW.is_paid_bid = true THEN
      INSERT INTO platform_invoices (
        user_id, invoice_type, amount, tax_amount, total_amount,
        description, due_date, related_transaction_id, metadata
      )
      VALUES (
        NEW.supplier_id,
        'bid_fee',
        v_bid_fee,
        ROUND(v_bid_fee * 0.18, 2),
        ROUND(v_bid_fee * 1.18, 2),
        'Paid Bid Fee (₹500) for Bid #' || SUBSTRING(NEW.id::TEXT, 1, 8),
        CURRENT_DATE + INTERVAL '7 days',
        v_transaction_id,
        jsonb_build_object('bid_id', NEW.id, 'requirement_id', NEW.requirement_id, 'is_paid_bid', true)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update create_logistics_service_fee_invoice function to create additional ₹500 invoice for paid bids
CREATE OR REPLACE FUNCTION public.create_logistics_service_fee_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_transaction_id UUID;
  v_bid_fee NUMERIC := 500;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get transaction ID
    SELECT id INTO v_transaction_id FROM logistics_transactions WHERE bid_id = NEW.id LIMIT 1;
    
    -- Insert service fee invoice (0.25%)
    INSERT INTO platform_invoices (
      user_id, invoice_type, amount, tax_amount, total_amount,
      description, due_date, related_transaction_id, metadata
    )
    VALUES (
      NEW.transporter_id,
      'service_fee',
      NEW.service_fee,
      ROUND(NEW.service_fee * 0.18, 2),
      ROUND(NEW.service_fee * 1.18, 2),
      'Logistics Service Fee (0.25%) for Bid #' || SUBSTRING(NEW.id::TEXT, 1, 8),
      CURRENT_DATE + INTERVAL '7 days',
      v_transaction_id,
      jsonb_build_object('logistics_bid_id', NEW.id, 'logistics_requirement_id', NEW.requirement_id)
    );
    
    -- If this was a paid bid (after free tier), create additional ₹500 invoice
    IF NEW.is_paid_bid = true THEN
      INSERT INTO platform_invoices (
        user_id, invoice_type, amount, tax_amount, total_amount,
        description, due_date, related_transaction_id, metadata
      )
      VALUES (
        NEW.transporter_id,
        'bid_fee',
        v_bid_fee,
        ROUND(v_bid_fee * 0.18, 2),
        ROUND(v_bid_fee * 1.18, 2),
        'Paid Bid Fee (₹500) for Logistics Bid #' || SUBSTRING(NEW.id::TEXT, 1, 8),
        CURRENT_DATE + INTERVAL '7 days',
        v_transaction_id,
        jsonb_build_object('logistics_bid_id', NEW.id, 'logistics_requirement_id', NEW.requirement_id, 'is_paid_bid', true)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;