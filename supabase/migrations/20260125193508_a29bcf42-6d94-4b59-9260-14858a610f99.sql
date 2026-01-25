
-- Fix promote_signal_on_visit to match frontend call signature
-- Frontend passes: slug (via dbSlug), country

DROP FUNCTION IF EXISTS promote_signal_on_visit(TEXT, TEXT);

CREATE OR REPLACE FUNCTION promote_signal_on_visit(p_slug TEXT, p_country TEXT DEFAULT 'india')
RETURNS VOID AS $$
DECLARE
  v_signal_page_id UUID;
  v_country_lower TEXT;
BEGIN
  v_country_lower := LOWER(p_country);
  
  -- Find signal page by slug and country
  SELECT id INTO v_signal_page_id
  FROM admin_signal_pages
  WHERE slug = p_slug 
    AND (LOWER(target_country) = v_country_lower 
         OR target_country = 'india' 
         OR LOWER(target_country) LIKE '%' || v_country_lower || '%')
  LIMIT 1;
  
  IF v_signal_page_id IS NULL THEN 
    -- Try just by slug
    SELECT id INTO v_signal_page_id FROM admin_signal_pages WHERE slug = p_slug LIMIT 1;
  END IF;
  
  IF v_signal_page_id IS NULL THEN RETURN; END IF;
  
  -- Increment views and intent score
  UPDATE admin_signal_pages
  SET views = COALESCE(views, 0) + 1, 
      intent_score = COALESCE(intent_score, 0) + 1, 
      updated_at = NOW()
  WHERE id = v_signal_page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
