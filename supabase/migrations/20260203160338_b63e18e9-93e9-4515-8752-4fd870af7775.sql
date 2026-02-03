-- Add session_id column to rfq_drafts if it doesn't exist
ALTER TABLE public.rfq_drafts 
ADD COLUMN IF NOT EXISTS session_id text;

-- Add form_data column to store partial form state for recovery
ALTER TABLE public.rfq_drafts 
ADD COLUMN IF NOT EXISTS form_data jsonb;

-- Add page_url column to track which page the draft came from
ALTER TABLE public.rfq_drafts 
ADD COLUMN IF NOT EXISTS page_url text;

-- Create index on session_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_rfq_drafts_session_id ON public.rfq_drafts(session_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_rfq_drafts_created_at ON public.rfq_drafts(created_at DESC);

-- Create composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_rfq_drafts_user_status ON public.rfq_drafts(user_id, status);

-- Enable RLS on rfq_drafts
ALTER TABLE public.rfq_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rfq_drafts

-- Allow anyone to insert drafts (for unauthenticated users tracking)
DROP POLICY IF EXISTS "Anyone can insert rfq drafts" ON public.rfq_drafts;
CREATE POLICY "Anyone can insert rfq drafts"
ON public.rfq_drafts FOR INSERT
WITH CHECK (true);

-- Users can view their own drafts (by user_id)
DROP POLICY IF EXISTS "Users can view own drafts" ON public.rfq_drafts;
CREATE POLICY "Users can view own drafts"
ON public.rfq_drafts FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all drafts
DROP POLICY IF EXISTS "Admins can view all drafts" ON public.rfq_drafts;
CREATE POLICY "Admins can view all drafts"
ON public.rfq_drafts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can update their own drafts
DROP POLICY IF EXISTS "Users can update own drafts" ON public.rfq_drafts;
CREATE POLICY "Users can update own drafts"
ON public.rfq_drafts FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update all drafts
DROP POLICY IF EXISTS "Admins can update all drafts" ON public.rfq_drafts;
CREATE POLICY "Admins can update all drafts"
ON public.rfq_drafts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));