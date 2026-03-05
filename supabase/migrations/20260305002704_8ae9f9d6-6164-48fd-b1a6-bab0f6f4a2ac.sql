INSERT INTO sku_industry_mapping (sku_slug, industry_slug, sub_cluster) VALUES
  ('copper-cathodes-india', 'metals', 'non-ferrous'),
  ('zinc-ingots-india', 'metals', 'non-ferrous'),
  ('lead-ingots-india', 'metals', 'non-ferrous'),
  ('ms-pipes-india', 'metals', 'ferrous'),
  ('cr-coil-india', 'metals', 'ferrous'),
  ('gi-pipes-india', 'metals', 'ferrous'),
  ('structural-fasteners-india', 'industrial-supplies', 'fasteners'),
  ('high-tensile-bolts-india', 'industrial-supplies', 'fasteners'),
  ('bitumen-vg30-india', 'industrial-supplies', 'construction'),
  ('industrial-valves-india', 'industrial-supplies', 'flow-control')
ON CONFLICT (sku_slug) DO NOTHING;