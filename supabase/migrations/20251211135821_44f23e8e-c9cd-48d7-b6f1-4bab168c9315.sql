-- Create lead activities table for tracking calls, emails, meetings
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.supplier_leads(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task')),
  subject TEXT NOT NULL,
  description TEXT,
  outcome TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own lead activities
CREATE POLICY "Suppliers can manage own lead activities"
  ON public.lead_activities
  FOR ALL
  USING (auth.uid() = supplier_id);

-- Create indexes
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_supplier_id ON public.lead_activities(supplier_id);
CREATE INDEX idx_lead_activities_date ON public.lead_activities(activity_date DESC);

-- Enable pg_cron and pg_net extensions for scheduled reminders
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;