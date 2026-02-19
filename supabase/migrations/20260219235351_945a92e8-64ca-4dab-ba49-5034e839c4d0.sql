
-- Create rewrite queue table (columns were already added by partial migration)
CREATE TABLE IF NOT EXISTS public.seo_rewrite_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false
);

-- Enable RLS on rewrite queue
ALTER TABLE public.seo_rewrite_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy using business_type
CREATE POLICY "Admin access only on seo_rewrite_queue"
ON public.seo_rewrite_queue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.business_type IN ('admin', 'ps_admin')
  )
);
