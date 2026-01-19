-- Create lane_events audit table for transition history
CREATE TABLE public.lane_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.demand_intelligence_signals(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'LANE_STATE_CHANGED',
  country TEXT,
  category TEXT,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('system', 'admin', 'supplier')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_lane_events_signal_id ON public.lane_events(signal_id);
CREATE INDEX idx_lane_events_occurred_at ON public.lane_events(occurred_at DESC);
CREATE INDEX idx_lane_events_country_category ON public.lane_events(country, category);

-- Enable RLS
ALTER TABLE public.lane_events ENABLE ROW LEVEL SECURITY;

-- Admin full access policy
CREATE POLICY "Admins can manage lane events"
  ON public.lane_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Public read for analytics
CREATE POLICY "Authenticated users can view lane events"
  ON public.lane_events
  FOR SELECT
  USING (auth.role() = 'authenticated');