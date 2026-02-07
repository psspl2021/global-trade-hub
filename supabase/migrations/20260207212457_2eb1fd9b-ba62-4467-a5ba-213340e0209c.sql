-- ============================================================
-- BUYER COMPANY & PURCHASER HIERARCHY TABLES
-- ============================================================
-- Enables multi-purchaser management per buyer company
-- with category-wise assignment and management oversight

-- Add buyer_hr role to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'buyer_hr';

-- Create buyer_companies table (represents enterprise buyer organizations)
CREATE TABLE public.buyer_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create buyer_company_members table (links users to companies with roles)
CREATE TABLE public.buyer_company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('buyer_purchaser', 'buyer_cfo', 'buyer_ceo', 'buyer_hr', 'buyer_manager')),
  assigned_categories TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_buyer_company_members_company ON public.buyer_company_members(company_id);
CREATE INDEX idx_buyer_company_members_user ON public.buyer_company_members(user_id);

-- Enable RLS
ALTER TABLE public.buyer_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_company_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own company
CREATE POLICY "Users can view own company"
  ON public.buyer_companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.buyer_company_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Admin can view all companies
CREATE POLICY "Admin can view all companies"
  ON public.buyer_companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'ps_admin')
    )
  );

-- RLS Policy: Users can view members of their own company
CREATE POLICY "Users can view company members"
  ON public.buyer_company_members FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.buyer_company_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Admin can view all members
CREATE POLICY "Admin can view all members"
  ON public.buyer_company_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'ps_admin')
    )
  );

-- RLS Policy: Management can update member categories
CREATE POLICY "Management can update members"
  ON public.buyer_company_members FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.buyer_company_members 
      WHERE user_id = auth.uid() 
      AND role IN ('buyer_cfo', 'buyer_ceo', 'buyer_manager')
    )
  );

-- Function to get purchasers in the same company
CREATE OR REPLACE FUNCTION public.get_company_purchasers(_user_id UUID)
RETURNS TABLE (
  member_id UUID,
  user_id UUID,
  display_name TEXT,
  role TEXT,
  assigned_categories TEXT[],
  is_current_user BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bcm.id AS member_id,
    bcm.user_id,
    COALESCE(p.contact_person, p.company_name, 'Purchaser') AS display_name,
    bcm.role,
    bcm.assigned_categories,
    (bcm.user_id = _user_id) AS is_current_user
  FROM public.buyer_company_members bcm
  JOIN public.profiles p ON p.id = bcm.user_id
  WHERE bcm.company_id IN (
    SELECT company_id FROM public.buyer_company_members WHERE user_id = _user_id
  )
  AND bcm.role IN ('buyer_purchaser', 'purchaser', 'buyer')
  AND bcm.is_active = true
  ORDER BY (bcm.user_id = _user_id) DESC, p.contact_person ASC;
$$;

-- Function to check if user is management role
CREATE OR REPLACE FUNCTION public.is_buyer_management(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.buyer_company_members
    WHERE user_id = _user_id 
    AND role IN ('buyer_cfo', 'buyer_ceo', 'buyer_hr', 'buyer_manager')
    AND is_active = true
  );
$$;

-- Create updated_at trigger
CREATE TRIGGER update_buyer_companies_updated_at
  BEFORE UPDATE ON public.buyer_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyer_company_members_updated_at
  BEFORE UPDATE ON public.buyer_company_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();