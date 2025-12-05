-- Enable realtime for stock_inventory table
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_inventory;

-- Also enable realtime for products table for product updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;