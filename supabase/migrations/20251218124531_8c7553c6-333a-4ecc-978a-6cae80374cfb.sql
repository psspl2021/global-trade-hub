-- Create supplier_customers table (similar to buyer_suppliers)
CREATE TABLE public.supplier_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  gstin TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_sales table (similar to buyer_purchases)
CREATE TABLE public.supplier_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  customer_id UUID REFERENCES public.supplier_customers(id) ON DELETE SET NULL,
  invoice_number TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_sale_items table (similar to buyer_purchase_items)
CREATE TABLE public.supplier_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.supplier_sales(id) ON DELETE CASCADE,
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
ALTER TABLE public.supplier_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_customers
CREATE POLICY "Suppliers can manage own customers"
  ON public.supplier_customers
  FOR ALL
  USING (auth.uid() = supplier_id);

-- RLS policies for supplier_sales
CREATE POLICY "Suppliers can manage own sales"
  ON public.supplier_sales
  FOR ALL
  USING (auth.uid() = supplier_id);

-- RLS policies for supplier_sale_items
CREATE POLICY "Suppliers can manage own sale items"
  ON public.supplier_sale_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.supplier_sales
    WHERE supplier_sales.id = supplier_sale_items.sale_id
    AND supplier_sales.supplier_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_supplier_customers_updated_at
  BEFORE UPDATE ON public.supplier_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_sales_updated_at
  BEFORE UPDATE ON public.supplier_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();