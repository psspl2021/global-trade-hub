
-- Create team_invites table for invite-state persistence
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text DEFAULT 'buyer_purchaser',
  company_id uuid REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  invited_by uuid,
  status text DEFAULT 'pending',
  categories text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can read a specific invite by ID (needed for /invite/:id page before login)
CREATE POLICY "Anyone can read invite by id"
  ON public.team_invites FOR SELECT
  USING (true);

-- Authenticated users can insert invites (team admins)
CREATE POLICY "Authenticated users can create invites"
  ON public.team_invites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = invited_by);

-- Authenticated users can update invites (accept/decline)
CREATE POLICY "Authenticated users can update invites"
  ON public.team_invites FOR UPDATE
  TO authenticated
  USING (true);

-- Index for fast lookup by email
CREATE INDEX idx_team_invites_email ON public.team_invites(email);
CREATE INDEX idx_team_invites_status ON public.team_invites(status);

-- Update auto_provision_buyer_company to skip if there's a pending invite
CREATE OR REPLACE FUNCTION public.auto_provision_buyer_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_profile_record record;
  v_user_role text;
  v_invite record;
  v_user_email text;
BEGIN
  -- Get the user's role from user_roles table
  SELECT role::text INTO v_user_role
  FROM public.user_roles
  WHERE user_id = NEW.id
  LIMIT 1;

  -- Only process buyer roles
  IF v_user_role IS NULL OR NOT (
    v_user_role LIKE 'buyer%' OR 
    v_user_role IN ('purchaser', 'cfo', 'ceo', 'manager', 'hr')
  ) THEN
    RETURN NEW;
  END IF;

  -- Check if user already has a company membership
  IF EXISTS (
    SELECT 1 FROM public.buyer_company_members 
    WHERE user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Check if there's a pending/accepted invite for this user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.id;
  
  SELECT * INTO v_invite
  FROM public.team_invites
  WHERE lower(email) = lower(v_user_email)
    AND status IN ('pending', 'accepted')
    AND company_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite IS NOT NULL THEN
    -- Join the existing company from the invite
    INSERT INTO public.buyer_company_members (
      company_id,
      user_id,
      role,
      assigned_categories,
      is_active
    ) VALUES (
      v_invite.company_id,
      NEW.id,
      COALESCE(v_invite.role, 'purchaser'),
      COALESCE(v_invite.categories, ARRAY[]::text[]),
      true
    );

    -- Mark invite as accepted
    UPDATE public.team_invites
    SET status = 'accepted', updated_at = now()
    WHERE id = v_invite.id;

    RETURN NEW;
  END IF;

  -- No invite found — create a new company (original behavior)
  SELECT company_name, contact_person, city, state, country, gstin
  INTO v_profile_record
  FROM public.profiles
  WHERE id = NEW.id;

  INSERT INTO public.buyer_companies (
    company_name,
    city,
    state,
    country,
    gstin
  ) VALUES (
    COALESCE(v_profile_record.company_name, 'My Company'),
    v_profile_record.city,
    v_profile_record.state,
    v_profile_record.country,
    v_profile_record.gstin
  )
  RETURNING id INTO v_company_id;

  INSERT INTO public.buyer_company_members (
    company_id,
    user_id,
    role,
    assigned_categories,
    is_active
  ) VALUES (
    v_company_id,
    NEW.id,
    CASE 
      WHEN v_user_role IN ('buyer_cfo', 'cfo') THEN 'cfo'
      WHEN v_user_role IN ('buyer_ceo', 'ceo') THEN 'ceo'
      WHEN v_user_role IN ('buyer_hr', 'hr') THEN 'hr'
      WHEN v_user_role IN ('buyer_manager', 'manager') THEN 'manager'
      ELSE 'purchaser'
    END,
    ARRAY[]::text[],
    true
  );

  RETURN NEW;
END;
$$;
