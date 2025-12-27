-- Add supplier notification subcategories column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS supplier_notification_subcategories text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.supplier_notification_subcategories IS 'Subcategories for which supplier wants to receive email notifications about new requirements';