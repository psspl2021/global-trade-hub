
-- Create vehicle type enum
CREATE TYPE public.vehicle_type AS ENUM ('truck', 'trailer', 'tanker', 'container_truck', 'mini_truck', 'pickup', 'tempo', 'lpv');

-- Create fuel type enum
CREATE TYPE public.fuel_type AS ENUM ('diesel', 'petrol', 'cng', 'electric', 'hybrid');

-- Create warehouse type enum
CREATE TYPE public.warehouse_type AS ENUM ('dry_storage', 'cold_storage', 'bonded', 'open_yard', 'hazmat', 'general');

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type public.vehicle_type NOT NULL,
  registration_number TEXT NOT NULL,
  model TEXT,
  manufacturer TEXT,
  capacity_tons NUMERIC(10,2),
  capacity_volume_cbm NUMERIC(10,2),
  fuel_type public.fuel_type DEFAULT 'diesel',
  year_of_manufacture INTEGER,
  is_available BOOLEAN DEFAULT true,
  current_location TEXT,
  insurance_valid_until DATE,
  permit_valid_until DATE,
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(registration_number)
);

-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  total_area_sqft NUMERIC(12,2) NOT NULL,
  available_area_sqft NUMERIC(12,2) NOT NULL,
  rental_rate_per_sqft NUMERIC(10,2),
  warehouse_type public.warehouse_type DEFAULT 'general',
  facilities JSONB DEFAULT '{"loading_dock": false, "forklift": false, "security_24x7": false, "cctv": false, "fire_safety": false}',
  operating_hours TEXT,
  is_active BOOLEAN DEFAULT true,
  contact_person TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "Partners can manage own vehicles"
ON public.vehicles FOR ALL
USING (auth.uid() = partner_id);

CREATE POLICY "Authenticated users can view available vehicles"
ON public.vehicles FOR SELECT
USING (is_available = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all vehicles"
ON public.vehicles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for warehouses
CREATE POLICY "Partners can manage own warehouses"
ON public.warehouses FOR ALL
USING (auth.uid() = partner_id);

CREATE POLICY "Authenticated users can view active warehouses"
ON public.warehouses FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all warehouses"
ON public.warehouses FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
