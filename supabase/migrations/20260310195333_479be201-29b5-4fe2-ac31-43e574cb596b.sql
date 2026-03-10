CREATE TABLE public.indexed_pages (
  url TEXT PRIMARY KEY,
  indexed BOOLEAN NOT NULL DEFAULT false,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.indexed_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on indexed_pages" ON public.indexed_pages
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated insert/update on indexed_pages" ON public.indexed_pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);