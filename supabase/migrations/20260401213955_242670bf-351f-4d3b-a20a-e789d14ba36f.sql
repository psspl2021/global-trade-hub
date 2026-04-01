
-- Create demand_gaps table for server-side gap persistence
CREATE TABLE public.demand_gaps (
  slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  score NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  source TEXT DEFAULT 'organic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public inserts (anonymous visitors track gaps)
ALTER TABLE public.demand_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert demand gaps"
  ON public.demand_gaps FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update demand gaps"
  ON public.demand_gaps FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read demand gaps"
  ON public.demand_gaps FOR SELECT
  TO authenticated
  USING (true);

-- Index for cron sorting
CREATE INDEX idx_demand_gaps_score ON public.demand_gaps(score DESC);

-- Function to upsert a demand gap with decay-aware scoring
CREATE OR REPLACE FUNCTION public.upsert_demand_gap(
  p_slug TEXT,
  p_category TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  INSERT INTO demand_gaps (slug, count, last_seen, score, category, created_at, updated_at)
  VALUES (
    p_slug, 1, v_now,
    1.0, -- initial score
    p_category,
    v_now, v_now
  )
  ON CONFLICT (slug) DO UPDATE SET
    count = demand_gaps.count + 1,
    last_seen = v_now,
    category = COALESCE(EXCLUDED.category, demand_gaps.category),
    score = (demand_gaps.count + 1) * 2.0 * exp(-EXTRACT(EPOCH FROM (v_now - demand_gaps.last_seen)) / (7 * 86400)),
    updated_at = v_now;
END;
$$;
