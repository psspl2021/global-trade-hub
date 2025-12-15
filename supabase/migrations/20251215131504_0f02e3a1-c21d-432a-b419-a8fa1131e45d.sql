-- Add address fields to profiles table for logistics partners
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS house_address TEXT,
ADD COLUMN IF NOT EXISTS office_address TEXT;

-- Add new document types for address verification with geolocation
-- The partner_documents table already exists, we just need to support new document_type values
-- We'll store geolocation data in a new column

ALTER TABLE public.partner_documents
ADD COLUMN IF NOT EXISTS geolocation JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment explaining geolocation structure
COMMENT ON COLUMN public.partner_documents.geolocation IS 'Stores latitude, longitude, accuracy for geotagged address verification photos';