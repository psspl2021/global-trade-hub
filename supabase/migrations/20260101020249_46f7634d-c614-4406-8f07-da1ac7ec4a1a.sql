-- Create unique index on company_name (case-insensitive) to prevent duplicates
CREATE UNIQUE INDEX idx_profiles_company_name_unique ON public.profiles (LOWER(company_name));