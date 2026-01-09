-- Supplier Performance Metrics Table
CREATE TABLE public.supplier_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  total_orders INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  late_deliveries INTEGER DEFAULT 0,
  quality_rejections INTEGER DEFAULT 0,
  quality_complaints INTEGER DEFAULT 0,
  avg_delivery_days NUMERIC(5,2) DEFAULT 0,
  delivery_success_rate NUMERIC(5,4) DEFAULT 0,
  quality_score NUMERIC(5,4) DEFAULT 1,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_supplier_performance UNIQUE (supplier_id)
);

-- Supplier Category Performance (per SKU/category performance)
CREATE TABLE public.supplier_category_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  category TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  avg_price_per_unit NUMERIC(12,2),
  l1_wins INTEGER DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_supplier_category UNIQUE (supplier_id, category)
);

-- Supplier Selection Log (audit trail for AI decisions)
CREATE TABLE public.supplier_selection_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  selection_mode TEXT NOT NULL CHECK (selection_mode IN ('bidding', 'auto_assign')),
  selected_supplier_id UUID NOT NULL,
  selected_bid_id UUID REFERENCES public.bids(id),
  total_landed_cost NUMERIC(12,2),
  material_cost NUMERIC(12,2),
  logistics_cost NUMERIC(12,2),
  delivery_success_probability NUMERIC(5,4),
  quality_risk_score NUMERIC(5,4),
  ai_reasoning JSONB,
  runner_up_suppliers JSONB,
  fallback_triggered BOOLEAN DEFAULT false,
  fallback_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supplier Inventory Signals
CREATE TABLE public.supplier_inventory_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  category TEXT NOT NULL,
  product_name TEXT,
  available_quantity NUMERIC(12,2) DEFAULT 0,
  unit TEXT DEFAULT 'MT',
  location TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_supplier_inventory UNIQUE (supplier_id, category, product_name)
);

-- Enable RLS
ALTER TABLE public.supplier_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_category_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_selection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_inventory_signals ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (service role can access all)
CREATE POLICY "Admins can view supplier performance"
ON public.supplier_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage supplier performance"
ON public.supplier_performance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view category performance"
ON public.supplier_category_performance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage category performance"
ON public.supplier_category_performance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view selection logs"
ON public.supplier_selection_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage selection logs"
ON public.supplier_selection_log FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Suppliers can view own inventory"
ON public.supplier_inventory_signals FOR SELECT
USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can manage own inventory"
ON public.supplier_inventory_signals FOR ALL
USING (supplier_id = auth.uid());

CREATE POLICY "Admins can view all inventory"
ON public.supplier_inventory_signals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Function to update supplier performance after order completion
CREATE OR REPLACE FUNCTION public.update_supplier_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update supplier performance
  INSERT INTO public.supplier_performance (supplier_id, total_orders, last_order_date)
  VALUES (NEW.supplier_id, 1, now())
  ON CONFLICT (supplier_id) 
  DO UPDATE SET 
    total_orders = supplier_performance.total_orders + 1,
    last_order_date = now(),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update performance when bid is accepted
CREATE TRIGGER update_performance_on_bid_accepted
AFTER UPDATE ON public.bids
FOR EACH ROW
WHEN (OLD.status != 'accepted' AND NEW.status = 'accepted')
EXECUTE FUNCTION public.update_supplier_performance();

-- Function to calculate delivery success rate
CREATE OR REPLACE FUNCTION public.calculate_delivery_success_rate(p_supplier_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total INTEGER;
  v_successful INTEGER;
BEGIN
  SELECT total_orders, successful_deliveries 
  INTO v_total, v_successful
  FROM public.supplier_performance 
  WHERE supplier_id = p_supplier_id;
  
  IF v_total IS NULL OR v_total = 0 THEN
    RETURN 0.85; -- Default for new suppliers
  END IF;
  
  RETURN ROUND(v_successful::NUMERIC / v_total::NUMERIC, 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Indexes for performance
CREATE INDEX idx_supplier_performance_supplier ON public.supplier_performance(supplier_id);
CREATE INDEX idx_supplier_category_perf_supplier ON public.supplier_category_performance(supplier_id);
CREATE INDEX idx_supplier_category_perf_category ON public.supplier_category_performance(category);
CREATE INDEX idx_supplier_selection_log_req ON public.supplier_selection_log(requirement_id);
CREATE INDEX idx_supplier_inventory_supplier ON public.supplier_inventory_signals(supplier_id);
CREATE INDEX idx_supplier_inventory_category ON public.supplier_inventory_signals(category);