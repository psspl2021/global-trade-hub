
-- Phase 5: Google Index Queue Table
CREATE TABLE IF NOT EXISTS public.google_index_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual',
  source_id text,
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  processed_at timestamptz
);

ALTER TABLE public.google_index_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage index queue"
ON public.google_index_queue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'ps_admin'::app_role])
  )
);

CREATE INDEX idx_index_queue_processed ON public.google_index_queue(processed) WHERE processed = false;
CREATE INDEX idx_index_queue_created ON public.google_index_queue(created_at DESC);

-- Trigger function to auto-queue URLs on demand signal insert
CREATE OR REPLACE FUNCTION public.queue_index_on_signal_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.google_index_queue (url, source_type, source_id)
  VALUES (
    'https://www.procuresaathi.com/demand/' || LOWER(NEW.country) || '-' || LOWER(REPLACE(NEW.category, ' ', '-')),
    'demand_signal',
    NEW.id::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_queue_index_on_signal
AFTER INSERT ON public.demand_intelligence_signals
FOR EACH ROW
EXECUTE FUNCTION public.queue_index_on_signal_insert();

-- Trigger function to auto-queue URLs on contract approval
CREATE OR REPLACE FUNCTION public.queue_index_on_contract_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    INSERT INTO public.google_index_queue (url, source_type, source_id)
    VALUES (
      'https://www.procuresaathi.com/demand/' || LOWER(COALESCE(NEW.country, 'global')) || '-' || LOWER(REPLACE(COALESCE(NEW.category, 'general'), ' ', '-')),
      'contract_approved',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_queue_index_on_contract
AFTER INSERT OR UPDATE ON public.contract_summaries
FOR EACH ROW
EXECUTE FUNCTION public.queue_index_on_contract_approved();
