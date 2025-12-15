-- Create enum for logistics partner type
CREATE TYPE public.logistics_partner_type AS ENUM ('agent', 'fleet_owner');

-- Add logistics_partner_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN logistics_partner_type public.logistics_partner_type DEFAULT NULL;

-- Create partner_documents table for storing verification documents
CREATE TABLE public.partner_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('aadhar_card', 'pan_card', 'notary_agreement')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(partner_id, document_type)
);

-- Enable RLS
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can insert own documents" 
ON public.partner_documents 
FOR INSERT 
WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can view own documents" 
ON public.partner_documents 
FOR SELECT 
USING (auth.uid() = partner_id);

CREATE POLICY "Partners can update own pending documents" 
ON public.partner_documents 
FOR UPDATE 
USING (auth.uid() = partner_id AND verification_status = 'pending');

CREATE POLICY "Admins can view all documents" 
ON public.partner_documents 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update documents" 
ON public.partner_documents 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_partner_documents_updated_at
BEFORE UPDATE ON public.partner_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for partner documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for partner-documents bucket
CREATE POLICY "Partners can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'partner-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Partners can view own documents storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'partner-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all partner documents storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'partner-documents' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partners can delete own pending documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'partner-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);