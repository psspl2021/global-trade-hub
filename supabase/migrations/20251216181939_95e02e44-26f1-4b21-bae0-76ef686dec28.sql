-- Create buyer_suppliers table for buyers to manage their own suppliers
CREATE TABLE public.buyer_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  supplier_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  gstin TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create buyer_purchases table to track purchases from suppliers
CREATE TABLE public.buyer_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.buyer_suppliers(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create buyer_purchase_items table for line items
CREATE TABLE public.buyer_purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.buyer_purchases(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'units',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyer_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_purchase_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for buyer_suppliers
CREATE POLICY "Buyers can manage own suppliers" ON public.buyer_suppliers
  FOR ALL USING (auth.uid() = buyer_id);

-- RLS policies for buyer_purchases
CREATE POLICY "Buyers can manage own purchases" ON public.buyer_purchases
  FOR ALL USING (auth.uid() = buyer_id);

-- RLS policies for buyer_purchase_items
CREATE POLICY "Buyers can manage own purchase items" ON public.buyer_purchase_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.buyer_purchases 
    WHERE buyer_purchases.id = buyer_purchase_items.purchase_id 
    AND buyer_purchases.buyer_id = auth.uid()
  ));

-- Create updated_at triggers
CREATE TRIGGER update_buyer_suppliers_updated_at
  BEFORE UPDATE ON public.buyer_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyer_purchases_updated_at
  BEFORE UPDATE ON public.buyer_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();