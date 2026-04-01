
CREATE TABLE public.demand_generated (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  category_slug TEXT,
  industry_slug TEXT,
  sub_industry_slug TEXT,
  definition TEXT,
  industries TEXT[] DEFAULT '{}',
  grades TEXT[] DEFAULT '{}',
  specifications TEXT[] DEFAULT '{}',
  standards TEXT[] DEFAULT '{}',
  hsn_codes TEXT[] DEFAULT '{}',
  order_sizes TEXT,
  import_countries TEXT[] DEFAULT '{}',
  related_slugs TEXT[] DEFAULT '{}',
  price_range TEXT,
  applications TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  market_trend TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  generated_by TEXT DEFAULT 'ai',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_generated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of active demand pages"
  ON public.demand_generated
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Allow authenticated insert"
  ON public.demand_generated
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
