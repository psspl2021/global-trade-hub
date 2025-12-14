-- Add company logo URL to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload own logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update own logo" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete own logo" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to view logos (for document printing)
CREATE POLICY "Anyone can view logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');