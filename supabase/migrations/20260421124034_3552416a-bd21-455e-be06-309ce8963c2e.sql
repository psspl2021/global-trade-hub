-- ============================================================
-- INTERNATIONAL TRADE INFRASTRUCTURE
-- ============================================================

-- 1. HS Code + Country of Origin on requirement_items & bid_items
ALTER TABLE public.requirement_items
  ADD COLUMN IF NOT EXISTS hs_code TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT;

ALTER TABLE public.bid_items
  ADD COLUMN IF NOT EXISTS hs_code TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT;

-- 2. FX snapshot fields on bids (fx_rate_to_inr already exists)
ALTER TABLE public.bids
  ADD COLUMN IF NOT EXISTS fx_source TEXT,
  ADD COLUMN IF NOT EXISTS fx_timestamp TIMESTAMPTZ;

-- 3. Global supplier KYC fields on buyer_suppliers
ALTER TABLE public.buyer_suppliers
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS tax_id_type TEXT,
  ADD COLUMN IF NOT EXISTS tax_id_value TEXT,
  ADD COLUMN IF NOT EXISTS business_registration_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_swift TEXT,
  ADD COLUMN IF NOT EXISTS bank_iban TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS aeo_certified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aeo_cert_number TEXT,
  ADD COLUMN IF NOT EXISTS beneficial_owner_name TEXT,
  ADD COLUMN IF NOT EXISTS beneficial_owner_id TEXT,
  ADD COLUMN IF NOT EXISTS sanctions_screening_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sanctions_screened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sanctions_screening_notes TEXT,
  ADD COLUMN IF NOT EXISTS w_form_type TEXT,
  ADD COLUMN IF NOT EXISTS ubo_declared BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_verified_by UUID;

-- 4. KYC documents table
CREATE TABLE IF NOT EXISTS public.supplier_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.buyer_suppliers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  notes TEXT
);
ALTER TABLE public.supplier_kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers manage own supplier KYC docs"
  ON public.supplier_kyc_documents FOR ALL
  USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admins view all KYC docs"
  ON public.supplier_kyc_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Export documents table
CREATE TABLE IF NOT EXISTS public.export_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT,
  storage_path TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.export_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers manage own export docs"
  ON public.export_documents FOR ALL
  USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admins view all export docs"
  ON public.export_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. International logistics requests
CREATE TABLE IF NOT EXISTS public.international_logistics_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  origin_country TEXT NOT NULL,
  origin_address TEXT,
  destination_country TEXT NOT NULL,
  destination_address TEXT,
  incoterms TEXT,
  hs_codes TEXT[],
  total_weight_kg NUMERIC,
  total_volume_m3 NUMERIC,
  cargo_description TEXT,
  preferred_mode TEXT,
  ready_date DATE,
  required_by DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  assigned_partner_id UUID,
  buyer_notes TEXT,
  partner_quote_amount NUMERIC,
  partner_quote_currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.international_logistics_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers manage own intl logistics"
  ON public.international_logistics_requests FOR ALL
  USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admins view all intl logistics"
  ON public.international_logistics_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_intl_logistics_updated_at
  BEFORE UPDATE ON public.international_logistics_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('export-documents', 'export-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Buyers upload own KYC docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Buyers read own KYC docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Buyers delete own KYC docs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Buyers read own export docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'export-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service writes export docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'export-documents');