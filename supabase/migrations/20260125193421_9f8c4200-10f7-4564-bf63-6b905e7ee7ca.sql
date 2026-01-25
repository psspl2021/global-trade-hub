
-- ================================================================
-- FIX: Global Demand Heatmap Pipeline - Complete Repair
-- ================================================================

-- STEP 1: Drop the conflicting function first
DROP FUNCTION IF EXISTS promote_signal_on_visit(TEXT, TEXT);
DROP FUNCTION IF EXISTS promote_signal_on_visit(TEXT);

-- STEP 2: Populate admin_signal_pages with all signal page slugs
DELETE FROM admin_signal_pages WHERE is_active = false;

INSERT INTO admin_signal_pages (slug, category, subcategory, headline, target_country, is_active, views, rfqs_submitted, intent_score)
VALUES
  -- Steel category pages
  ('structural-steel-infrastructure', 'Metals - Ferrous (Steel, Iron)', 'Structural Steel', 'Structural Steel for Infrastructure', 'india', true, 0, 0, 0),
  ('tmt-bars-epc-projects', 'Metals - Ferrous (Steel, Iron)', 'TMT Bars', 'TMT Bars for EPC Projects', 'india', true, 0, 0, 0),
  ('hot-rolled-coil-industrial', 'Metals - Ferrous (Steel, Iron)', 'Hot Rolled Coil', 'Hot Rolled Coil for Industrial Manufacturing', 'india', true, 0, 0, 0),
  ('heavy-steel-plates', 'Metals - Ferrous (Steel, Iron)', 'Steel Plates', 'Heavy Steel Plates Procurement', 'india', true, 0, 0, 0),
  ('stainless-steel-industrial', 'Metals - Ferrous (Steel, Iron)', 'Stainless Steel', 'Stainless Steel for Industrial Use', 'india', true, 0, 0, 0),
  ('galvanized-steel-products', 'Metals - Ferrous (Steel, Iron)', 'Galvanized Steel', 'Galvanized Steel Products', 'india', true, 0, 0, 0),
  ('alloy-steel-engineering', 'Metals - Ferrous (Steel, Iron)', 'Alloy Steel', 'Alloy Steel for Engineering', 'india', true, 0, 0, 0),
  ('rail-steel-track-materials', 'Metals - Ferrous (Steel, Iron)', 'Rail Steel', 'Rail Steel Track Materials', 'india', true, 0, 0, 0),
  ('industrial-chemicals-bulk', 'Chemicals - Industrial', 'Industrial Chemicals', 'Industrial Chemicals Bulk Procurement', 'india', true, 0, 0, 0),
  ('specialty-chemicals-manufacturing', 'Chemicals - Specialty', 'Specialty Chemicals', 'Specialty Chemicals for Manufacturing', 'india', true, 0, 0, 0),
  ('water-treatment-chemicals', 'Chemicals - Water Treatment', 'Water Treatment', 'Water Treatment Chemicals', 'india', true, 0, 0, 0),
  ('construction-chemicals', 'Chemicals - Construction', 'Construction Chemicals', 'Construction Chemicals Procurement', 'india', true, 0, 0, 0),
  ('polymer-resins-plastics', 'Polymers & Plastics', 'Polymer Resins', 'Polymer Resins & Plastics', 'india', true, 0, 0, 0),
  ('engineering-plastics-oem', 'Polymers & Plastics', 'Engineering Plastics', 'Engineering Plastics for OEM', 'india', true, 0, 0, 0),
  ('aluminium-extrusions-profiles', 'Metals - Non-Ferrous', 'Aluminium Extrusions', 'Aluminium Extrusions & Profiles', 'india', true, 0, 0, 0),
  ('copper-products-electrical', 'Metals - Non-Ferrous', 'Copper Products', 'Copper Products for Electrical', 'india', true, 0, 0, 0),
  ('solar-project-equipment', 'Energy & Power', 'Solar Equipment', 'Solar Project Equipment', 'india', true, 0, 0, 0),
  ('electrical-equipment-power', 'Energy & Power', 'Electrical Equipment', 'Electrical Equipment for Power', 'india', true, 0, 0, 0),
  ('food-ingredients-bulk', 'Food & Agriculture', 'Food Ingredients', 'Food Ingredients Bulk', 'india', true, 0, 0, 0),
  ('agricultural-inputs', 'Food & Agriculture', 'Agricultural Inputs', 'Agricultural Inputs Procurement', 'india', true, 0, 0, 0),
  ('textile-raw-materials', 'Textiles & Fabrics', 'Textile Raw Materials', 'Textile Raw Materials', 'india', true, 0, 0, 0),
  ('technical-textiles', 'Textiles & Fabrics', 'Technical Textiles', 'Technical Textiles', 'india', true, 0, 0, 0),
  ('pharma-api-bulk', 'Pharmaceuticals & Healthcare', 'Pharma API', 'Pharma API Bulk', 'india', true, 0, 0, 0),
  ('medical-consumables', 'Pharmaceuticals & Healthcare', 'Medical Consumables', 'Medical Consumables', 'india', true, 0, 0, 0),
  ('packaging-materials-industrial', 'Packaging Materials', 'Industrial Packaging', 'Industrial Packaging Materials', 'india', true, 0, 0, 0),
  ('cement-construction-materials', 'Construction Materials', 'Cement', 'Cement & Construction Materials', 'india', true, 0, 0, 0),
  ('bitumen-petroleum-products', 'Petroleum Products', 'Bitumen', 'Bitumen & Petroleum Products', 'india', true, 0, 0, 0),
  ('paper-packaging-materials', 'Paper & Packaging', 'Paper Materials', 'Paper & Packaging Materials', 'india', true, 0, 0, 0),
  ('electronic-components-procurement', 'Electronics & Components', 'Electronic Components', 'Electronic Components', 'india', true, 0, 0, 0),
  ('industrial-machinery-equipment', 'Industrial Machinery', 'Industrial Machinery', 'Industrial Machinery & Equipment', 'india', true, 0, 0, 0),
  ('mro-supplies-industrial', 'MRO Supplies', 'MRO Supplies', 'MRO Supplies Industrial', 'india', true, 0, 0, 0),
  ('rubber-products-industrial', 'Rubber Products', 'Industrial Rubber', 'Industrial Rubber Products', 'india', true, 0, 0, 0),
  ('minerals-mining-products', 'Minerals & Mining', 'Mining Products', 'Minerals & Mining Products', 'india', true, 0, 0, 0),
  ('glass-ceramics-industrial', 'Glass & Ceramics', 'Industrial Glass', 'Industrial Glass & Ceramics', 'india', true, 0, 0, 0),
  ('paints-coatings-industrial', 'Paints & Coatings', 'Industrial Paints', 'Industrial Paints & Coatings', 'india', true, 0, 0, 0),
  ('cosmetics-personal-care', 'Personal Care & Cosmetics', 'Cosmetics', 'Cosmetics & Personal Care', 'india', true, 0, 0, 0),
  ('lubricants-greases-industrial', 'Lubricants & Greases', 'Industrial Lubricants', 'Industrial Lubricants & Greases', 'india', true, 0, 0, 0)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  headline = EXCLUDED.headline,
  is_active = true;

-- STEP 3: Create trigger function for RFQ -> Demand Signal
CREATE OR REPLACE FUNCTION create_demand_signal_from_rfq()
RETURNS TRIGGER AS $$
DECLARE
  v_signal_page RECORD;
  v_estimated_value NUMERIC;
BEGIN
  IF NEW.signal_page_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT * INTO v_signal_page 
  FROM admin_signal_pages 
  WHERE id = NEW.signal_page_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  SELECT COALESCE(SUM(COALESCE(budget_max, budget_min, 0) * quantity), 100000)
  INTO v_estimated_value
  FROM requirement_items
  WHERE requirement_id = NEW.id;
  
  INSERT INTO demand_intelligence_signals (
    signal_source, signal_page_id, converted_to_rfq_id, category, subcategory,
    country, classification, lane_state, intent_score, estimated_value,
    delivery_location, product_description, buyer_type, confidence_score, discovered_at
  ) VALUES (
    'signal_page', NEW.signal_page_id, NEW.id, v_signal_page.category, v_signal_page.subcategory,
    COALESCE(v_signal_page.target_country, 'india'), 'buy', 'pending_activation', 10, v_estimated_value,
    NEW.delivery_location, NEW.title, COALESCE(NEW.trade_type, 'domestic'), 0.9, NOW()
  )
  ON CONFLICT DO NOTHING;
  
  UPDATE admin_signal_pages
  SET rfqs_submitted = COALESCE(rfqs_submitted, 0) + 1,
      intent_score = COALESCE(intent_score, 0) + 5,
      updated_at = NOW()
  WHERE id = NEW.signal_page_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_create_demand_signal_on_rfq ON requirements;

CREATE TRIGGER trg_create_demand_signal_on_rfq
  AFTER INSERT ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION create_demand_signal_from_rfq();

-- STEP 4: Create trigger for bid acceptance -> lane activation
CREATE OR REPLACE FUNCTION activate_demand_signal_on_bid_accept()
RETURNS TRIGGER AS $$
DECLARE
  v_requirement RECORD;
BEGIN
  IF NEW.status != 'accepted' OR (OLD IS NOT NULL AND OLD.status = 'accepted') THEN
    RETURN NEW;
  END IF;
  
  SELECT * INTO v_requirement FROM requirements WHERE id = NEW.requirement_id;
  
  IF NOT FOUND OR v_requirement.signal_page_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  UPDATE demand_intelligence_signals
  SET lane_state = 'activated', awarded_bid_id = NEW.id, awarded_supplier_id = NEW.supplier_id,
      awarded_value = NEW.total_amount, activated_at = NOW(), updated_at = NOW()
  WHERE converted_to_rfq_id = NEW.requirement_id AND signal_page_id = v_requirement.signal_page_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_activate_signal_on_bid_accept ON bids;

CREATE TRIGGER trg_activate_signal_on_bid_accept
  AFTER INSERT OR UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION activate_demand_signal_on_bid_accept();

-- STEP 5: Recreate promote_signal_on_visit with fresh signature
CREATE OR REPLACE FUNCTION promote_signal_on_visit(slug_param TEXT, country_param TEXT DEFAULT 'india')
RETURNS VOID AS $$
DECLARE
  v_signal_page_id UUID;
BEGIN
  SELECT id INTO v_signal_page_id
  FROM admin_signal_pages
  WHERE slug = slug_param AND (target_country = country_param OR target_country = 'india')
  LIMIT 1;
  
  IF v_signal_page_id IS NULL THEN RETURN; END IF;
  
  UPDATE admin_signal_pages
  SET views = COALESCE(views, 0) + 1, intent_score = COALESCE(intent_score, 0) + 1, updated_at = NOW()
  WHERE id = v_signal_page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- STEP 6: Add indexes
CREATE INDEX IF NOT EXISTS idx_demand_signals_signal_page_id ON demand_intelligence_signals(signal_page_id);
CREATE INDEX IF NOT EXISTS idx_demand_signals_converted_rfq ON demand_intelligence_signals(converted_to_rfq_id);
CREATE INDEX IF NOT EXISTS idx_demand_signals_lane_state ON demand_intelligence_signals(lane_state);
CREATE INDEX IF NOT EXISTS idx_admin_signal_pages_slug_country ON admin_signal_pages(slug, target_country);

-- STEP 7: Clean up false positives
UPDATE demand_intelligence_signals
SET lane_state = 'detected', classification = 'research'
WHERE (estimated_value IS NULL OR estimated_value = 0) AND lane_state != 'detected';
