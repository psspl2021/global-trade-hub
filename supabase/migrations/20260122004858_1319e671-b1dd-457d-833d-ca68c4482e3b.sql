-- Add priority column for enterprise lane tagging
ALTER TABLE public.demand_intelligence_signals
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Create index for priority filtering
CREATE INDEX IF NOT EXISTS idx_demand_signals_priority 
ON public.demand_intelligence_signals(priority);

-- Backfill Phase-2 + export lanes as revenue_high
UPDATE public.demand_intelligence_signals
SET priority = 'revenue_high'
WHERE category IN (
  'pharmaceuticals',
  'medical_healthcare',
  'electrical_equipment',
  'water_treatment',
  'storage_tanks',
  'export'
);

-- Also tag high-value lanes
UPDATE public.demand_intelligence_signals
SET priority = 'revenue_high'
WHERE estimated_value > 50000000 AND priority = 'normal';