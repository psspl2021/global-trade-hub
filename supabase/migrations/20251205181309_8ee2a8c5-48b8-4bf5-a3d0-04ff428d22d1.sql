-- Create supplier_api_keys table for API credential management
CREATE TABLE public.supplier_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  api_key_hash TEXT NOT NULL,
  api_key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default Key',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.supplier_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_api_keys
CREATE POLICY "Suppliers can view own API keys" 
  ON public.supplier_api_keys FOR SELECT 
  USING (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can insert own API keys" 
  ON public.supplier_api_keys FOR INSERT 
  WITH CHECK (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can update own API keys" 
  ON public.supplier_api_keys FOR UPDATE 
  USING (auth.uid() = supplier_id);

-- Create stock_sync_logs table for tracking sync history
CREATE TABLE public.stock_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  api_key_id UUID REFERENCES public.supplier_api_keys(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  products_updated INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_sync_logs
CREATE POLICY "Suppliers can view own sync logs" 
  ON public.stock_sync_logs FOR SELECT 
  USING (auth.uid() = supplier_id);

-- Allow edge function to insert sync logs (using service role)
CREATE POLICY "Service role can insert sync logs"
  ON public.stock_sync_logs FOR INSERT
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_supplier_api_keys_hash ON public.supplier_api_keys(api_key_hash) WHERE is_active = true;
CREATE INDEX idx_stock_sync_logs_supplier ON public.stock_sync_logs(supplier_id, created_at DESC);