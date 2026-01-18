-- Create atomic intent score increment function (lock-safe at scale)
CREATE OR REPLACE FUNCTION public.increment_intent_score(
  page_id uuid,
  delta integer
) RETURNS void AS $$
BEGIN
  UPDATE public.admin_signal_pages
  SET intent_score = COALESCE(intent_score, 0) + delta,
      updated_at = now()
  WHERE id = page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create atomic RFQ count increment function
CREATE OR REPLACE FUNCTION public.increment_rfq_count(
  page_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.admin_signal_pages
  SET rfqs_submitted = COALESCE(rfqs_submitted, 0) + 1,
      updated_at = now()
  WHERE id = page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create atomic views increment function
CREATE OR REPLACE FUNCTION public.increment_page_views(
  page_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.admin_signal_pages
  SET views = COALESCE(views, 0) + 1,
      intent_score = COALESCE(intent_score, 0) + 1,
      updated_at = now()
  WHERE id = page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;