-- Create simple global margin_settings table
CREATE TABLE public.margin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_margin_percent NUMERIC NOT NULL DEFAULT 3,
  risk_premium_percent NUMERIC NOT NULL DEFAULT 1,
  logistics_markup_percent NUMERIC NOT NULL DEFAULT 2,
  service_fee_percent NUMERIC NOT NULL DEFAULT 0.5,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.margin_settings ENABLE ROW LEVEL SECURITY;

-- Admin only policy (uses business_type correctly)
CREATE POLICY "Admin only access"
ON public.margin_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.business_type = 'admin'
  )
);

-- Insert default row
INSERT INTO public.margin_settings (base_margin_percent, risk_premium_percent, logistics_markup_percent, service_fee_percent)
VALUES (3, 1, 2, 0.5);

-- Add updated_at trigger
CREATE TRIGGER update_margin_settings_updated_at
BEFORE UPDATE ON public.margin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();