-- Create referrer_kyc_documents table for storing document info
CREATE TABLE public.referrer_kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('pan_card', 'aadhar_card', 'bank_details')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(referrer_id, document_type)
);

-- Enable RLS
ALTER TABLE public.referrer_kyc_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Referrers can view their own documents"
ON public.referrer_kyc_documents
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Referrers can insert their own documents"
ON public.referrer_kyc_documents
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Referrers can update their own pending documents"
ON public.referrer_kyc_documents
FOR UPDATE
USING (auth.uid() = referrer_id AND verification_status = 'pending');

CREATE POLICY "Referrers can delete their own pending documents"
ON public.referrer_kyc_documents
FOR DELETE
USING (auth.uid() = referrer_id AND verification_status = 'pending');

CREATE POLICY "Admins can view all documents"
ON public.referrer_kyc_documents
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all documents"
ON public.referrer_kyc_documents
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('referrer-kyc', 'referrer-kyc', false);

-- Storage policies for referrer-kyc bucket
CREATE POLICY "Referrers can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'referrer-kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Referrers can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'referrer-kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Referrers can delete their own KYC documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'referrer-kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'referrer-kyc' AND public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_referrer_kyc_documents_updated_at
BEFORE UPDATE ON public.referrer_kyc_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();