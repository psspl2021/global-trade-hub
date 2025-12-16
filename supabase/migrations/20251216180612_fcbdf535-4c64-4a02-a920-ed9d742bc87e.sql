-- Create buyer inventory table for stock management
CREATE TABLE public.buyer_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid NOT NULL,
  product_name text NOT NULL,
  category text,
  sku text,
  description text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'units',
  unit_price numeric,
  min_stock_level numeric DEFAULT 0,
  max_stock_level numeric,
  location text,
  supplier_name text,
  last_restocked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create buyer stock movements table for tracking stock in/out
CREATE TABLE public.buyer_stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id uuid NOT NULL REFERENCES public.buyer_inventory(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity numeric NOT NULL,
  reference_number text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyer_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for buyer_inventory
CREATE POLICY "Buyers can manage own inventory"
  ON public.buyer_inventory FOR ALL
  USING (auth.uid() = buyer_id);

-- RLS policies for buyer_stock_movements
CREATE POLICY "Buyers can manage own stock movements"
  ON public.buyer_stock_movements FOR ALL
  USING (auth.uid() = buyer_id);

-- Create trigger for updated_at
CREATE TRIGGER update_buyer_inventory_updated_at
  BEFORE UPDATE ON public.buyer_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();