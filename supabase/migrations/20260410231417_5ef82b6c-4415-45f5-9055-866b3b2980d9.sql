
-- 1. Add 'transporter' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'transporter';

-- 2. Add global columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS region_type TEXT DEFAULT 'india',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS business_registration TEXT;

-- 3. Add global columns to reverse_auctions
ALTER TABLE public.reverse_auctions 
  ADD COLUMN IF NOT EXISTS incoterm TEXT,
  ADD COLUMN IF NOT EXISTS origin_country TEXT,
  ADD COLUMN IF NOT EXISTS shipment_mode TEXT;

-- 4. Add global supplier columns to buyer_suppliers
ALTER TABLE public.buyer_suppliers
  ADD COLUMN IF NOT EXISTS is_global_supplier BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS export_capability BOOLEAN DEFAULT false;

-- 5. Create logistics_requests table
CREATE TABLE IF NOT EXISTS public.logistics_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  transporter_id UUID,
  origin_city TEXT NOT NULL,
  origin_state TEXT,
  origin_country TEXT NOT NULL DEFAULT 'India',
  destination_city TEXT NOT NULL,
  destination_state TEXT,
  destination_country TEXT NOT NULL DEFAULT 'India',
  cargo_type TEXT,
  cargo_description TEXT,
  weight_tons NUMERIC,
  volume_cbm NUMERIC,
  vehicle_type TEXT,
  shipment_mode TEXT DEFAULT 'road',
  pickup_date DATE,
  delivery_deadline DATE,
  budget_amount NUMERIC,
  currency TEXT DEFAULT 'INR',
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  awarded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.logistics_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logistics requests"
  ON public.logistics_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = transporter_id);

CREATE POLICY "Users can create their own logistics requests"
  ON public.logistics_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own logistics requests"
  ON public.logistics_requests FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = transporter_id);

CREATE POLICY "Transporters can view pending requests"
  ON public.logistics_requests FOR SELECT
  USING (status = 'pending');

-- 6. Create shipment_tracking table
CREATE TABLE IF NOT EXISTS public.shipment_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logistics_request_id UUID NOT NULL REFERENCES public.logistics_requests(id) ON DELETE CASCADE,
  transporter_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'picked_up',
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  notes TEXT,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tracking visible to requester and transporter"
  ON public.shipment_tracking FOR SELECT
  USING (
    auth.uid() = transporter_id 
    OR auth.uid() IN (SELECT requester_id FROM public.logistics_requests WHERE id = logistics_request_id)
  );

CREATE POLICY "Transporters can add tracking events"
  ON public.shipment_tracking FOR INSERT
  WITH CHECK (auth.uid() = transporter_id);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_logistics_requests_requester ON public.logistics_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_transporter ON public.logistics_requests(transporter_id);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_status ON public.logistics_requests(status);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_request ON public.shipment_tracking(logistics_request_id);

-- 8. Trigger: auto-set region_type on profiles
CREATE OR REPLACE FUNCTION public.auto_set_region_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.country IS NOT NULL THEN
    IF LOWER(NEW.country) IN ('india', 'in', 'ind') THEN
      NEW.region_type := 'india';
    ELSE
      NEW.region_type := 'global';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_set_region_type ON public.profiles;
CREATE TRIGGER trigger_auto_set_region_type
  BEFORE INSERT OR UPDATE OF country ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_region_type();

-- 9. Trigger: auto-tag global suppliers in buyer_suppliers
CREATE OR REPLACE FUNCTION public.auto_tag_global_supplier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supplier_country TEXT;
BEGIN
  -- Look up the supplier's country from profiles using email match
  SELECT country INTO supplier_country
  FROM public.profiles
  WHERE email = NEW.email
  LIMIT 1;
  
  IF supplier_country IS NOT NULL AND LOWER(supplier_country) NOT IN ('india', 'in', 'ind') THEN
    NEW.is_global_supplier := true;
    NEW.export_capability := true;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_tag_global_supplier ON public.buyer_suppliers;
CREATE TRIGGER trigger_auto_tag_global_supplier
  BEFORE INSERT OR UPDATE ON public.buyer_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_tag_global_supplier();

-- 10. Updated_at trigger for logistics_requests
CREATE TRIGGER update_logistics_requests_updated_at
  BEFORE UPDATE ON public.logistics_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Update existing profiles with region_type based on country
UPDATE public.profiles SET region_type = 'global' 
WHERE country IS NOT NULL AND LOWER(country) NOT IN ('india', 'in', 'ind', '');

UPDATE public.profiles SET region_type = 'india' 
WHERE country IS NULL OR LOWER(country) IN ('india', 'in', 'ind', '');
