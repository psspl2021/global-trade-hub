
-- 1. Global trade fields on auctions/RFQs
ALTER TABLE public.reverse_auctions
  ADD COLUMN IF NOT EXISTS incoterms text,
  ADD COLUMN IF NOT EXISTS hs_code text,
  ADD COLUMN IF NOT EXISTS port_of_loading text,
  ADD COLUMN IF NOT EXISTS port_of_discharge text;

ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS incoterms text,
  ADD COLUMN IF NOT EXISTS hs_code text,
  ADD COLUMN IF NOT EXISTS port_of_loading text,
  ADD COLUMN IF NOT EXISTS port_of_discharge text;

-- 2. Multi-currency bidding
ALTER TABLE public.bids
  ADD COLUMN IF NOT EXISTS bid_currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS fx_rate_to_inr numeric DEFAULT 1;

-- 3. Supplier global flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_global_supplier boolean DEFAULT false;

-- 4. FX Rates table (anchored to INR)
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code text NOT NULL UNIQUE,
  rate_to_inr numeric NOT NULL,  -- 1 unit of currency = X INR
  rate_from_inr numeric NOT NULL, -- 1 INR = X currency
  source text DEFAULT 'manual',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FX rates are viewable by everyone"
  ON public.fx_rates FOR SELECT USING (true);

CREATE POLICY "Only service role writes FX rates"
  ON public.fx_rates FOR ALL USING (false) WITH CHECK (false);

-- Seed initial rates (manual baseline)
INSERT INTO public.fx_rates (currency_code, rate_to_inr, rate_from_inr, source) VALUES
  ('USD', 83.33, 0.012, 'seed'),
  ('EUR', 90.91, 0.011, 'seed'),
  ('GBP', 105.26, 0.0095, 'seed'),
  ('AED', 22.73, 0.044, 'seed'),
  ('SAR', 22.22, 0.045, 'seed'),
  ('QAR', 22.73, 0.044, 'seed'),
  ('KES', 0.54, 1.86, 'seed'),
  ('NGN', 0.053, 18.8, 'seed'),
  ('JPY', 0.56, 1.79, 'seed'),
  ('CNY', 11.63, 0.086, 'seed'),
  ('VND', 0.0034, 295, 'seed'),
  ('SGD', 62.5, 0.016, 'seed'),
  ('AUD', 55.56, 0.018, 'seed'),
  ('INR', 1, 1, 'seed')
ON CONFLICT (currency_code) DO NOTHING;
