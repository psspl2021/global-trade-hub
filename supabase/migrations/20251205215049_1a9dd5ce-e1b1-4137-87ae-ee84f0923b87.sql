-- Create user_totp_secrets table for storing TOTP configuration
CREATE TABLE public.user_totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  encrypted_secret TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_totp_secrets ENABLE ROW LEVEL SECURITY;

-- Users can view their own TOTP settings
CREATE POLICY "Users can view own TOTP settings"
ON public.user_totp_secrets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own TOTP settings
CREATE POLICY "Users can insert own TOTP settings"
ON public.user_totp_secrets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own TOTP settings
CREATE POLICY "Users can update own TOTP settings"
ON public.user_totp_secrets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own TOTP settings
CREATE POLICY "Users can delete own TOTP settings"
ON public.user_totp_secrets
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_user_totp_secrets_updated_at
BEFORE UPDATE ON public.user_totp_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();