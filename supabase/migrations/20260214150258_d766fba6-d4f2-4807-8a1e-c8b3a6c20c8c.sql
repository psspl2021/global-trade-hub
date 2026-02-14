
-- =====================================================
-- GLOBAL DEMAND INTELLIGENCE: FULL COUNTRY EXPANSION
-- =====================================================

-- STEP 1: COUNTRIES_MASTER (190+ countries, ISO-driven)
CREATE TABLE IF NOT EXISTS countries_master (
  iso_code text PRIMARY KEY,
  country_name text NOT NULL,
  region text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE countries_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries master readable by all" ON countries_master
  FOR SELECT USING (true);

-- Seed 190+ countries
INSERT INTO countries_master (iso_code, country_name, region) VALUES
('AF','Afghanistan','Asia'),('AL','Albania','Europe'),('DZ','Algeria','Africa'),('AD','Andorra','Europe'),('AO','Angola','Africa'),
('AG','Antigua and Barbuda','Americas'),('AR','Argentina','Americas'),('AM','Armenia','Asia'),('AU','Australia','Oceania'),('AT','Austria','Europe'),
('AZ','Azerbaijan','Asia'),('BS','Bahamas','Americas'),('BH','Bahrain','Middle East'),('BD','Bangladesh','Asia'),('BB','Barbados','Americas'),
('BY','Belarus','Europe'),('BE','Belgium','Europe'),('BZ','Belize','Americas'),('BJ','Benin','Africa'),('BT','Bhutan','Asia'),
('BO','Bolivia','Americas'),('BA','Bosnia and Herzegovina','Europe'),('BW','Botswana','Africa'),('BR','Brazil','Americas'),('BN','Brunei','Asia'),
('BG','Bulgaria','Europe'),('BF','Burkina Faso','Africa'),('BI','Burundi','Africa'),('KH','Cambodia','Asia'),('CM','Cameroon','Africa'),
('CA','Canada','Americas'),('CV','Cape Verde','Africa'),('CF','Central African Republic','Africa'),('TD','Chad','Africa'),('CL','Chile','Americas'),
('CN','China','Asia'),('CO','Colombia','Americas'),('KM','Comoros','Africa'),('CG','Congo','Africa'),('CR','Costa Rica','Americas'),
('CI','Cote d Ivoire','Africa'),('HR','Croatia','Europe'),('CU','Cuba','Americas'),('CY','Cyprus','Europe'),('CZ','Czech Republic','Europe'),
('CD','DR Congo','Africa'),('DK','Denmark','Europe'),('DJ','Djibouti','Africa'),('DM','Dominica','Americas'),('DO','Dominican Republic','Americas'),
('EC','Ecuador','Americas'),('EG','Egypt','Africa'),('SV','El Salvador','Americas'),('GQ','Equatorial Guinea','Africa'),('ER','Eritrea','Africa'),
('EE','Estonia','Europe'),('SZ','Eswatini','Africa'),('ET','Ethiopia','Africa'),('FJ','Fiji','Oceania'),('FI','Finland','Europe'),
('FR','France','Europe'),('GA','Gabon','Africa'),('GM','Gambia','Africa'),('GE','Georgia','Asia'),('DE','Germany','Europe'),
('GH','Ghana','Africa'),('GR','Greece','Europe'),('GD','Grenada','Americas'),('GT','Guatemala','Americas'),('GN','Guinea','Africa'),
('GW','Guinea-Bissau','Africa'),('GY','Guyana','Americas'),('HT','Haiti','Americas'),('HN','Honduras','Americas'),('HU','Hungary','Europe'),
('IS','Iceland','Europe'),('IN','India','Asia'),('ID','Indonesia','Asia'),('IR','Iran','Asia'),('IQ','Iraq','Middle East'),
('IE','Ireland','Europe'),('IL','Israel','Middle East'),('IT','Italy','Europe'),('JM','Jamaica','Americas'),('JP','Japan','Asia'),
('JO','Jordan','Middle East'),('KZ','Kazakhstan','Asia'),('KE','Kenya','Africa'),('KI','Kiribati','Oceania'),('KW','Kuwait','Middle East'),
('KG','Kyrgyzstan','Asia'),('LA','Laos','Asia'),('LV','Latvia','Europe'),('LB','Lebanon','Middle East'),('LS','Lesotho','Africa'),
('LR','Liberia','Africa'),('LY','Libya','Africa'),('LI','Liechtenstein','Europe'),('LT','Lithuania','Europe'),('LU','Luxembourg','Europe'),
('MG','Madagascar','Africa'),('MW','Malawi','Africa'),('MY','Malaysia','Asia'),('MV','Maldives','Asia'),('ML','Mali','Africa'),
('MT','Malta','Europe'),('MH','Marshall Islands','Oceania'),('MR','Mauritania','Africa'),('MU','Mauritius','Africa'),('MX','Mexico','Americas'),
('FM','Micronesia','Oceania'),('MD','Moldova','Europe'),('MC','Monaco','Europe'),('MN','Mongolia','Asia'),('ME','Montenegro','Europe'),
('MA','Morocco','Africa'),('MZ','Mozambique','Africa'),('MM','Myanmar','Asia'),('NA','Namibia','Africa'),('NR','Nauru','Oceania'),
('NP','Nepal','Asia'),('NL','Netherlands','Europe'),('NZ','New Zealand','Oceania'),('NI','Nicaragua','Americas'),('NE','Niger','Africa'),
('NG','Nigeria','Africa'),('KP','North Korea','Asia'),('MK','North Macedonia','Europe'),('NO','Norway','Europe'),('OM','Oman','Middle East'),
('PK','Pakistan','Asia'),('PW','Palau','Oceania'),('PS','Palestine','Middle East'),('PA','Panama','Americas'),('PG','Papua New Guinea','Oceania'),
('PY','Paraguay','Americas'),('PE','Peru','Americas'),('PH','Philippines','Asia'),('PL','Poland','Europe'),('PT','Portugal','Europe'),
('QA','Qatar','Middle East'),('RO','Romania','Europe'),('RU','Russia','Europe'),('RW','Rwanda','Africa'),('KN','Saint Kitts and Nevis','Americas'),
('LC','Saint Lucia','Americas'),('VC','Saint Vincent','Americas'),('WS','Samoa','Oceania'),('SM','San Marino','Europe'),('ST','Sao Tome and Principe','Africa'),
('SA','Saudi Arabia','Middle East'),('SN','Senegal','Africa'),('RS','Serbia','Europe'),('SC','Seychelles','Africa'),('SL','Sierra Leone','Africa'),
('SG','Singapore','Asia'),('SK','Slovakia','Europe'),('SI','Slovenia','Europe'),('SB','Solomon Islands','Oceania'),('SO','Somalia','Africa'),
('ZA','South Africa','Africa'),('KR','South Korea','Asia'),('SS','South Sudan','Africa'),('ES','Spain','Europe'),('LK','Sri Lanka','Asia'),
('SD','Sudan','Africa'),('SR','Suriname','Americas'),('SE','Sweden','Europe'),('CH','Switzerland','Europe'),('SY','Syria','Middle East'),
('TW','Taiwan','Asia'),('TJ','Tajikistan','Asia'),('TZ','Tanzania','Africa'),('TH','Thailand','Asia'),('TL','Timor-Leste','Asia'),
('TG','Togo','Africa'),('TO','Tonga','Oceania'),('TT','Trinidad and Tobago','Americas'),('TN','Tunisia','Africa'),('TR','Turkey','Europe'),
('TM','Turkmenistan','Asia'),('TV','Tuvalu','Oceania'),('UG','Uganda','Africa'),('UA','Ukraine','Europe'),('AE','United Arab Emirates','Middle East'),
('GB','United Kingdom','Europe'),('US','United States','Americas'),('UY','Uruguay','Americas'),('UZ','Uzbekistan','Asia'),('VU','Vanuatu','Oceania'),
('VA','Vatican City','Europe'),('VE','Venezuela','Americas'),('VN','Vietnam','Asia'),('YE','Yemen','Middle East'),('ZM','Zambia','Africa'),
('ZW','Zimbabwe','Africa')
ON CONFLICT (iso_code) DO NOTHING;

-- STEP 2: NORMALIZE demand_intelligence_signals WITH country_iso
ALTER TABLE demand_intelligence_signals
ADD COLUMN IF NOT EXISTS country_iso text;

UPDATE demand_intelligence_signals
SET country_iso = UPPER(country)
WHERE country_iso IS NULL AND country IS NOT NULL;

ALTER TABLE demand_intelligence_signals
ADD CONSTRAINT fk_signals_country_iso
FOREIGN KEY (country_iso) REFERENCES countries_master(iso_code);

-- STEP 3: DECISION ACTION SAFETY TRIGGER
CREATE OR REPLACE FUNCTION enforce_valid_decision_action()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.decision_action IS NOT NULL
     AND NEW.decision_action NOT IN ('pending','approved','rejected') THEN
     RAISE EXCEPTION 'Invalid decision_action: %. Use activate_demand_lane() RPC.', NEW.decision_action;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_valid_decision_action ON demand_intelligence_signals;

CREATE TRIGGER trg_enforce_valid_decision_action
BEFORE INSERT OR UPDATE ON demand_intelligence_signals
FOR EACH ROW EXECUTE FUNCTION enforce_valid_decision_action();

-- STEP 4: SEO DEMAND PAGES TABLE
CREATE TABLE IF NOT EXISTS seo_demand_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_iso text REFERENCES countries_master(iso_code),
  category text NOT NULL,
  slug text UNIQUE NOT NULL,
  meta_title text,
  meta_description text,
  intent_weight numeric DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seo_demand_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SEO demand pages readable by all" ON seo_demand_pages
  FOR SELECT USING (true);

CREATE POLICY "SEO demand pages manageable by authenticated" ON seo_demand_pages
  FOR ALL USING (auth.uid() IS NOT NULL);

-- STEP 5: TRADE CORRIDORS TABLE
CREATE TABLE IF NOT EXISTS trade_corridors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_country text NOT NULL REFERENCES countries_master(iso_code),
  destination_country text NOT NULL REFERENCES countries_master(iso_code),
  category text,
  trade_intensity_score numeric DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(source_country, destination_country, category)
);

ALTER TABLE trade_corridors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trade corridors readable by all" ON trade_corridors
  FOR SELECT USING (true);

CREATE POLICY "Trade corridors manageable by authenticated" ON trade_corridors
  FOR ALL USING (auth.uid() IS NOT NULL);

-- STEP 6: ACTIVATE DEMAND LANE RPC (country_iso aware)
CREATE OR REPLACE FUNCTION activate_demand_lane(
  p_signal_id uuid,
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sig RECORD;
BEGIN
  SELECT * INTO sig FROM demand_intelligence_signals WHERE id = p_signal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND');
  END IF;

  IF sig.lane_state IN ('closed','lost') THEN
    RETURN jsonb_build_object('success', false, 'code', 'TERMINAL');
  END IF;

  IF sig.lane_state IN ('activated','fulfilling') THEN
    RETURN jsonb_build_object('success', false, 'code', 'ALREADY_ACTIVE');
  END IF;

  UPDATE demand_intelligence_signals
  SET lane_state = 'activated',
      decision_action = 'approved',
      activated_at = now(),
      decision_made_at = now(),
      decision_made_by = p_admin_id,
      updated_at = now()
  WHERE id = p_signal_id;

  INSERT INTO lane_events(signal_id, event_type, country, category, from_state, to_state, actor, occurred_at)
  VALUES(p_signal_id, 'LANE_ACTIVATED', COALESCE(sig.country_iso, sig.country), sig.category, sig.lane_state, 'activated', 'admin', now());

  RETURN jsonb_build_object('success', true, 'lane_state', 'activated');
END;
$$;

-- STEP 7: AUTO GENERATE GLOBAL DEMAND PAGES RPC
CREATE OR REPLACE FUNCTION generate_global_demand_pages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  cat RECORD;
  created_count integer := 0;
BEGIN
  FOR c IN SELECT iso_code, country_name FROM countries_master WHERE is_active = true LOOP
    FOR cat IN SELECT DISTINCT category FROM demand_intelligence_signals WHERE category IS NOT NULL LOOP
      INSERT INTO seo_demand_pages(country_iso, category, slug, meta_title, meta_description)
      VALUES(
        c.iso_code,
        cat.category,
        lower(c.iso_code || '-' || regexp_replace(cat.category, '[^a-zA-Z0-9]+', '-', 'g')),
        cat.category || ' Sourcing & Demand in ' || c.country_name,
        'Live AI demand intelligence for ' || cat.category || ' in ' || c.country_name || '. Track procurement signals, supplier availability, and trade corridors.'
      )
      ON CONFLICT (slug) DO NOTHING;
      created_count := created_count + 1;
    END LOOP;
  END LOOP;
  RETURN created_count;
END;
$$;

-- STEP 8: COUNTRY INTENT METRICS RPC
CREATE OR REPLACE FUNCTION get_country_intent_metrics()
RETURNS TABLE(
  country_iso text,
  country_name text,
  region text,
  total_intent numeric,
  active_lanes bigint,
  revenue_at_risk numeric,
  signal_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(s.country_iso, s.country) as country_iso,
    cm.country_name,
    cm.region,
    COALESCE(SUM(s.intent_score), 0) as total_intent,
    COUNT(*) FILTER (WHERE s.lane_state IN ('activated','fulfilling')) as active_lanes,
    COALESCE(SUM(s.estimated_value) FILTER (WHERE s.lane_state IN ('detected','pending')), 0) as revenue_at_risk,
    COUNT(*) as signal_count
  FROM demand_intelligence_signals s
  LEFT JOIN countries_master cm ON cm.iso_code = COALESCE(s.country_iso, s.country)
  GROUP BY COALESCE(s.country_iso, s.country), cm.country_name, cm.region;
$$;
