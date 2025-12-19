-- Add unique constraint on email in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Add unique constraint on phone in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);