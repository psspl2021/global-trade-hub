-- Add country column to demand_intelligence_signals for geo-specific demand tracking
ALTER TABLE public.demand_intelligence_signals
ADD COLUMN country TEXT DEFAULT 'india';

-- Create index for country-based queries (demand heatmap, geo analytics)
CREATE INDEX idx_demand_signals_country ON public.demand_intelligence_signals(country);

-- Create composite index for country + classification queries
CREATE INDEX idx_demand_signals_country_classification 
ON public.demand_intelligence_signals(country, classification)
WHERE decision_action = 'pending';

-- Add comment for clarity
COMMENT ON COLUMN public.demand_intelligence_signals.country IS 'Target country for demand signal - enables geo-specific demand intelligence';