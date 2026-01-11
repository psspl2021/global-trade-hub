-- Drop triggers first, then function, then recreate
DROP TRIGGER IF EXISTS update_ai_sales_leads_timestamp ON public.ai_sales_leads;
DROP TRIGGER IF EXISTS update_ai_sales_messages_timestamp ON public.ai_sales_messages;
DROP TRIGGER IF EXISTS update_ai_sales_landing_pages_timestamp ON public.ai_sales_landing_pages;

DROP FUNCTION IF EXISTS public.update_ai_sales_timestamp();

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION public.update_ai_sales_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_ai_sales_leads_timestamp
BEFORE UPDATE ON public.ai_sales_leads
FOR EACH ROW EXECUTE FUNCTION public.update_ai_sales_timestamp();

CREATE TRIGGER update_ai_sales_messages_timestamp
BEFORE UPDATE ON public.ai_sales_messages
FOR EACH ROW EXECUTE FUNCTION public.update_ai_sales_timestamp();

CREATE TRIGGER update_ai_sales_landing_pages_timestamp
BEFORE UPDATE ON public.ai_sales_landing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_ai_sales_timestamp();