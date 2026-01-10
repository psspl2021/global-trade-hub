-- Add supplier verification flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified_supplier BOOLEAN DEFAULT false;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_verified_supplier 
ON public.profiles(is_verified_supplier) 
WHERE is_verified_supplier = true;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.is_verified_supplier IS 'Indicates if supplier has completed verification (documents, GSTIN, etc.)';