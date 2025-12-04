-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('proforma_invoice', 'tax_invoice', 'purchase_order');

-- Create enum for document status
CREATE TYPE public.document_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'paid', 'cancelled');

-- Create invoices table (for proforma and tax invoices)
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  supplier_id UUID NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_address TEXT,
  buyer_gstin TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  document_type document_type NOT NULL DEFAULT 'proforma_invoice',
  status document_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  bank_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  hsn_code TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'units',
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL,
  supplier_id UUID NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_address TEXT,
  vendor_gstin TEXT,
  vendor_email TEXT,
  vendor_phone TEXT,
  status document_status NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  delivery_address TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.po_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hsn_code TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'units',
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Suppliers can manage own invoices" ON public.invoices
  FOR ALL USING (auth.uid() = supplier_id);

-- RLS Policies for invoice_items
CREATE POLICY "Suppliers can manage own invoice items" ON public.invoice_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.invoices WHERE id = invoice_items.invoice_id AND supplier_id = auth.uid()
  ));

-- RLS Policies for purchase_orders
CREATE POLICY "Suppliers can manage own purchase orders" ON public.purchase_orders
  FOR ALL USING (auth.uid() = supplier_id);

-- RLS Policies for po_items
CREATE POLICY "Suppliers can manage own PO items" ON public.po_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.purchase_orders WHERE id = po_items.po_id AND supplier_id = auth.uid()
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1001;