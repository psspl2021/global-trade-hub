-- Create requirement_items table for storing multiple items per requirement
CREATE TABLE public.requirement_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Pieces',
  budget_min NUMERIC,
  budget_max NUMERIC,
  specifications JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.requirement_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Buyers can manage own requirement items"
  ON public.requirement_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.requirements r 
    WHERE r.id = requirement_items.requirement_id 
    AND r.buyer_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can view active requirement items"
  ON public.requirement_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.requirements r 
    WHERE r.id = requirement_items.requirement_id 
    AND r.status = 'active'
  ));

CREATE POLICY "Admins can view all requirement items"
  ON public.requirement_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'));