-- Create shipment status enum
CREATE TYPE shipment_status AS ENUM (
  'awaiting_pickup',
  'picked_up',
  'in_transit',
  'at_checkpoint',
  'out_for_delivery',
  'delivered',
  'delayed',
  'cancelled'
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.logistics_transactions(id),
  requirement_id UUID NOT NULL REFERENCES public.logistics_requirements(id),
  bid_id UUID NOT NULL REFERENCES public.logistics_bids(id),
  transporter_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  status shipment_status NOT NULL DEFAULT 'awaiting_pickup',
  current_location TEXT,
  pickup_time TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipment updates table for tracking history
CREATE TABLE public.shipment_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status shipment_status NOT NULL,
  location TEXT,
  notes TEXT,
  photo_url TEXT,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipments
CREATE POLICY "Transporters can view own shipments"
ON public.shipments FOR SELECT
USING (auth.uid() = transporter_id);

CREATE POLICY "Customers can view own shipments"
ON public.shipments FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all shipments"
ON public.shipments FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Transporters can update own shipments"
ON public.shipments FOR UPDATE
USING (auth.uid() = transporter_id);

-- RLS Policies for shipment_updates
CREATE POLICY "Transporters can insert updates for own shipments"
ON public.shipment_updates FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.shipments 
  WHERE shipments.id = shipment_updates.shipment_id 
  AND shipments.transporter_id = auth.uid()
));

CREATE POLICY "Transporters can view updates for own shipments"
ON public.shipment_updates FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shipments 
  WHERE shipments.id = shipment_updates.shipment_id 
  AND shipments.transporter_id = auth.uid()
));

CREATE POLICY "Customers can view updates for own shipments"
ON public.shipment_updates FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shipments 
  WHERE shipments.id = shipment_updates.shipment_id 
  AND shipments.customer_id = auth.uid()
));

CREATE POLICY "Admins can view all shipment updates"
ON public.shipment_updates FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Trigger to auto-create shipment when logistics bid is accepted
CREATE OR REPLACE FUNCTION public.create_shipment_on_bid_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_requirement logistics_requirements%ROWTYPE;
  v_transaction_id UUID;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    SELECT * INTO v_requirement FROM logistics_requirements WHERE id = NEW.requirement_id;
    
    -- Get the transaction id
    SELECT id INTO v_transaction_id FROM logistics_transactions WHERE bid_id = NEW.id LIMIT 1;
    
    -- Create shipment record
    INSERT INTO shipments (
      transaction_id,
      requirement_id,
      bid_id,
      transporter_id,
      customer_id,
      vehicle_id,
      status,
      current_location,
      estimated_delivery
    )
    VALUES (
      v_transaction_id,
      NEW.requirement_id,
      NEW.id,
      NEW.transporter_id,
      v_requirement.customer_id,
      NEW.vehicle_id,
      'awaiting_pickup',
      v_requirement.pickup_location,
      v_requirement.delivery_deadline
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_logistics_bid_accepted_create_shipment
AFTER UPDATE ON public.logistics_bids
FOR EACH ROW
EXECUTE FUNCTION public.create_shipment_on_bid_acceptance();

-- Trigger to update shipment status and timestamps
CREATE OR REPLACE FUNCTION public.update_shipment_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the shipment record
  UPDATE shipments
  SET 
    status = NEW.status,
    current_location = COALESCE(NEW.location, current_location),
    pickup_time = CASE WHEN NEW.status = 'picked_up' AND pickup_time IS NULL THEN now() ELSE pickup_time END,
    delivered_at = CASE WHEN NEW.status = 'delivered' THEN now() ELSE delivered_at END,
    updated_at = now()
  WHERE id = NEW.shipment_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_shipment_update_sync_status
AFTER INSERT ON public.shipment_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_shipment_on_status_change();

-- Enable realtime for shipments and shipment_updates
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_updates;