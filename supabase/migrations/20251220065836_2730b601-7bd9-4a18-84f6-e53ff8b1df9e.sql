-- Add supplier_categories array for suppliers to specify their supply categories
ALTER TABLE public.profiles ADD COLUMN supplier_categories text[] DEFAULT '{}';

-- Add buyer_industry for buyers to specify their industry
ALTER TABLE public.profiles ADD COLUMN buyer_industry text;