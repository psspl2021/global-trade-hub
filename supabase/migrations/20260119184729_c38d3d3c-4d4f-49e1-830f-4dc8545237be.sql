-- PART 1: Lane State Machine - Extend demand_intelligence_signals
ALTER TABLE public.demand_intelligence_signals
ADD COLUMN IF NOT EXISTS lane_state TEXT DEFAULT 'detected',
ADD COLUMN IF NOT EXISTS first_signal_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fulfilling_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lost_at TIMESTAMP WITH TIME ZONE;

-- Create index for lane_state queries
CREATE INDEX IF NOT EXISTS idx_demand_signals_lane_state 
ON public.demand_intelligence_signals(lane_state);

-- Update existing signals to have proper lane_state based on decision_action
UPDATE public.demand_intelligence_signals
SET 
  lane_state = CASE
    WHEN decision_action = 'activated' THEN 'activated'
    WHEN decision_action = 'rejected' THEN 'lost'
    WHEN decision_action = 'convert_rfq' THEN 'fulfilling'
    WHEN decision_action IS NOT NULL THEN 'pending'
    ELSE 'detected'
  END,
  first_signal_at = COALESCE(discovered_at, created_at);

-- PART 2: Supplier Capacity Lanes Table
CREATE TABLE public.supplier_capacity_lanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  category TEXT NOT NULL,
  monthly_capacity_value NUMERIC NOT NULL DEFAULT 0,
  allocated_capacity_value NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(country, category)
);

-- Create index for fast lookups
CREATE INDEX idx_capacity_country_category 
ON public.supplier_capacity_lanes(country, category);

-- Enable RLS
ALTER TABLE public.supplier_capacity_lanes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin full access using user_roles table
CREATE POLICY "Admin full access to capacity lanes"
ON public.supplier_capacity_lanes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Public read access for dashboard
CREATE POLICY "Public read access to capacity lanes"
ON public.supplier_capacity_lanes
FOR SELECT
USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_capacity_lanes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_capacity_lanes_timestamp
BEFORE UPDATE ON public.supplier_capacity_lanes
FOR EACH ROW
EXECUTE FUNCTION public.update_capacity_lanes_updated_at();

-- Seed initial capacity data for key lanes
INSERT INTO public.supplier_capacity_lanes (country, category, monthly_capacity_value, allocated_capacity_value, active)
VALUES
  ('IN', 'Steel', 500000000, 0, true),
  ('IN', 'Chemicals', 300000000, 0, true),
  ('IN', 'Polymers', 200000000, 0, true),
  ('IN', 'Non-Ferrous Metals', 150000000, 0, true),
  ('AE', 'Steel', 250000000, 0, true),
  ('AE', 'Chemicals', 180000000, 0, true),
  ('SA', 'Steel', 200000000, 0, true),
  ('SA', 'Chemicals', 150000000, 0, true),
  ('US', 'Steel', 400000000, 0, true),
  ('US', 'Chemicals', 350000000, 0, true);