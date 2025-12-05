-- Create logistics requirement status enum
CREATE TYPE logistics_requirement_status AS ENUM ('active', 'closed', 'cancelled');

-- Create logistics bid status enum
CREATE TYPE logistics_bid_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create logistics_requirements table
CREATE TABLE public.logistics_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL,
  material_description TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'tons',
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  delivery_deadline DATE NOT NULL,
  vehicle_type_preference vehicle_type,
  special_requirements TEXT,
  budget_max NUMERIC,
  status logistics_requirement_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create logistics_bids table
CREATE TABLE public.logistics_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.logistics_requirements(id) ON DELETE CASCADE,
  transporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  bid_amount NUMERIC NOT NULL,
  service_fee NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  estimated_transit_days INTEGER NOT NULL,
  terms_and_conditions TEXT,
  status logistics_bid_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create logistics_transactions table
CREATE TABLE public.logistics_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES public.logistics_bids(id),
  amount NUMERIC NOT NULL,
  service_fee NUMERIC NOT NULL,
  fee_paid BOOLEAN NOT NULL DEFAULT false,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.logistics_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for logistics_requirements
CREATE POLICY "Customers can manage own logistics requirements"
ON public.logistics_requirements FOR ALL
USING (auth.uid() = customer_id);

CREATE POLICY "Authenticated users can view active logistics requirements"
ON public.logistics_requirements FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can view all logistics requirements"
ON public.logistics_requirements FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for logistics_bids
CREATE POLICY "Transporters can create logistics bids"
ON public.logistics_bids FOR INSERT
WITH CHECK (auth.uid() = transporter_id);

CREATE POLICY "Transporters can view own logistics bids"
ON public.logistics_bids FOR SELECT
USING (auth.uid() = transporter_id);

CREATE POLICY "Transporters can update own pending logistics bids"
ON public.logistics_bids FOR UPDATE
USING (auth.uid() = transporter_id AND status = 'pending');

CREATE POLICY "Customers can view bids on own logistics requirements"
ON public.logistics_bids FOR SELECT
USING (EXISTS (
  SELECT 1 FROM logistics_requirements
  WHERE logistics_requirements.id = logistics_bids.requirement_id
  AND logistics_requirements.customer_id = auth.uid()
));

CREATE POLICY "Customers can update bid status on own requirements"
ON public.logistics_bids FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM logistics_requirements
  WHERE logistics_requirements.id = logistics_bids.requirement_id
  AND logistics_requirements.customer_id = auth.uid()
));

CREATE POLICY "Admins can view all logistics bids"
ON public.logistics_bids FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for logistics_transactions
CREATE POLICY "Users can view own logistics transactions"
ON public.logistics_transactions FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = transporter_id);

CREATE POLICY "Admins can view all logistics transactions"
ON public.logistics_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update logistics transactions"
ON public.logistics_transactions FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Function to get lowest logistics bid
CREATE OR REPLACE FUNCTION public.get_lowest_logistics_bid(req_id uuid)
RETURNS TABLE(lowest_bid_amount numeric, bid_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    MIN(total_amount) as lowest_bid_amount,
    COUNT(*)::integer as bid_count
  FROM logistics_bids 
  WHERE requirement_id = req_id 
    AND status = 'pending'
$$;

-- Trigger function for logistics bid acceptance
CREATE OR REPLACE FUNCTION public.handle_logistics_bid_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_requirement logistics_requirements%ROWTYPE;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    SELECT * INTO v_requirement FROM logistics_requirements WHERE id = NEW.requirement_id;
    
    INSERT INTO logistics_transactions (customer_id, transporter_id, bid_id, amount, service_fee)
    VALUES (
      v_requirement.customer_id,
      NEW.transporter_id,
      NEW.id,
      NEW.bid_amount,
      NEW.service_fee
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for logistics bid acceptance
CREATE TRIGGER on_logistics_bid_accepted
AFTER UPDATE ON public.logistics_bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_logistics_bid_acceptance();

-- Trigger function to create service fee invoice for logistics
CREATE OR REPLACE FUNCTION public.create_logistics_service_fee_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO platform_invoices (
      user_id,
      invoice_type,
      amount,
      tax_amount,
      total_amount,
      description,
      due_date,
      related_transaction_id,
      metadata
    )
    SELECT 
      NEW.transporter_id,
      'service_fee',
      NEW.service_fee,
      ROUND(NEW.service_fee * 0.18, 2),
      ROUND(NEW.service_fee * 1.18, 2),
      'Logistics Service Fee (0.25%) for Bid #' || SUBSTRING(NEW.id::TEXT, 1, 8),
      CURRENT_DATE + INTERVAL '7 days',
      t.id,
      jsonb_build_object('logistics_bid_id', NEW.id, 'logistics_requirement_id', NEW.requirement_id)
    FROM logistics_transactions t
    WHERE t.bid_id = NEW.id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for logistics service fee invoice
CREATE TRIGGER on_logistics_bid_accepted_create_invoice
AFTER UPDATE ON public.logistics_bids
FOR EACH ROW
EXECUTE FUNCTION public.create_logistics_service_fee_invoice();

-- Update timestamp trigger for logistics_requirements
CREATE TRIGGER update_logistics_requirements_updated_at
BEFORE UPDATE ON public.logistics_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for logistics_bids
CREATE TRIGGER update_logistics_bids_updated_at
BEFORE UPDATE ON public.logistics_bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();