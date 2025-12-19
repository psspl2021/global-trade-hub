-- Add is_test_account column to profiles table
ALTER TABLE public.profiles ADD COLUMN is_test_account boolean NOT NULL DEFAULT false;

-- Mark the test accounts
UPDATE public.profiles SET is_test_account = true WHERE id IN (
  '9eb62531-9afa-4e22-a93d-e9b369fd44fb',
  '7ced4193-1481-4814-94fb-a3e6ef6d4c1e'
);