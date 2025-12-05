-- Create vehicle verification status enum
CREATE TYPE public.vehicle_verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Add new columns to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN rc_document_url text,
ADD COLUMN rc_uploaded_at timestamp with time zone,
ADD COLUMN verification_status public.vehicle_verification_status NOT NULL DEFAULT 'pending',
ADD COLUMN verified_at timestamp with time zone,
ADD COLUMN verified_by uuid,
ADD COLUMN rejection_reason text,
ADD COLUMN routes jsonb DEFAULT '[]'::jsonb;

-- Add unique constraint on registration_number
ALTER TABLE public.vehicles
ADD CONSTRAINT vehicles_registration_number_unique UNIQUE (registration_number);

-- Create storage bucket for vehicle documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-documents', 'vehicle-documents', false);

-- Storage policies: Partners can upload their own vehicle documents
CREATE POLICY "Partners can upload vehicle documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Partners can view their own vehicle documents
CREATE POLICY "Partners can view own vehicle documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vehicle-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Partners can delete their own vehicle documents
CREATE POLICY "Partners can delete own vehicle documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all vehicle documents
CREATE POLICY "Admins can view all vehicle documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vehicle-documents' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Drop and recreate the public vehicle view policy to only show verified vehicles
DROP POLICY IF EXISTS "Authenticated users can view available vehicles" ON public.vehicles;

CREATE POLICY "Authenticated users can view verified available vehicles"
ON public.vehicles FOR SELECT
USING (
  (is_available = true AND verification_status = 'verified' AND auth.uid() IS NOT NULL)
  OR auth.uid() = partner_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);