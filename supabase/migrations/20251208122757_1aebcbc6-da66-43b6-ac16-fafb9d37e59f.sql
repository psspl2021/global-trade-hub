-- Page visits tracking table for real visitor analytics
CREATE TABLE public.page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  source TEXT DEFAULT 'Direct',
  device_type TEXT DEFAULT 'desktop',
  browser TEXT,
  country TEXT,
  country_code TEXT,
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for faster analytics queries
CREATE INDEX idx_page_visits_created_at ON page_visits(created_at);
CREATE INDEX idx_page_visits_visitor_id ON page_visits(visitor_id);
CREATE INDEX idx_page_visits_source ON page_visits(source);
CREATE INDEX idx_page_visits_page_path ON page_visits(page_path);

-- Enable RLS
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert page visits (including anonymous visitors)
CREATE POLICY "Anyone can insert page visits" ON page_visits
  FOR INSERT WITH CHECK (true);

-- Only admins can read page visits
CREATE POLICY "Admins can read page visits" ON page_visits
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));