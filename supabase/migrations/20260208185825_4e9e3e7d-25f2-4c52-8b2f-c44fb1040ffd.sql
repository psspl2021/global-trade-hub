-- Create buyer_role_security table for storing role PINs
CREATE TABLE IF NOT EXISTS public.buyer_role_security (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('buyer_cfo', 'buyer_ceo', 'buyer_hr', 'buyer_manager')),
  role_pin_hash text NOT NULL,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create role_verification_logs for audit trail
CREATE TABLE IF NOT EXISTS public.role_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role text NOT NULL,
  action text NOT NULL CHECK (action IN ('unlock_attempt', 'unlock_success', 'unlock_failure', 'role_switch', 'session_expired')),
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyer_role_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_verification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for buyer_role_security
CREATE POLICY "Users can view own role security"
  ON public.buyer_role_security
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role security"
  ON public.buyer_role_security
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role security"
  ON public.buyer_role_security
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for role_verification_logs (users can insert, admins can read all)
CREATE POLICY "Users can insert own verification logs"
  ON public.role_verification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own verification logs"
  ON public.role_verification_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to verify role PIN (uses pgcrypto for bcrypt)
CREATE OR REPLACE FUNCTION public.verify_role_pin(
  _user_id uuid,
  _role text,
  _pin text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_hash text;
  v_is_valid boolean;
  v_log_id uuid;
BEGIN
  -- Get stored hash
  SELECT role_pin_hash INTO v_stored_hash
  FROM public.buyer_role_security
  WHERE user_id = _user_id AND role = _role;

  -- If no PIN set, return error
  IF v_stored_hash IS NULL THEN
    -- Log attempt
    INSERT INTO public.role_verification_logs (user_id, target_role, action, metadata)
    VALUES (_user_id, _role, 'unlock_failure', '{"reason": "no_pin_configured"}'::jsonb);
    
    RETURN json_build_object(
      'success', false,
      'error', 'no_pin_configured',
      'message', 'No PIN configured for this role. Please set up a PIN first.'
    );
  END IF;

  -- Verify PIN using crypt
  v_is_valid := (v_stored_hash = crypt(_pin, v_stored_hash));

  IF v_is_valid THEN
    -- Update last verified timestamp
    UPDATE public.buyer_role_security
    SET last_verified_at = now(), updated_at = now()
    WHERE user_id = _user_id AND role = _role;

    -- Log success
    INSERT INTO public.role_verification_logs (user_id, target_role, action)
    VALUES (_user_id, _role, 'unlock_success')
    RETURNING id INTO v_log_id;

    RETURN json_build_object(
      'success', true,
      'verified_at', now(),
      'log_id', v_log_id
    );
  ELSE
    -- Log failure
    INSERT INTO public.role_verification_logs (user_id, target_role, action, metadata)
    VALUES (_user_id, _role, 'unlock_failure', '{"reason": "invalid_pin"}'::jsonb);

    RETURN json_build_object(
      'success', false,
      'error', 'invalid_pin',
      'message', 'Invalid PIN. Please try again.'
    );
  END IF;
END;
$$;

-- Function to set/update role PIN
CREATE OR REPLACE FUNCTION public.set_role_pin(
  _user_id uuid,
  _role text,
  _pin text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
BEGIN
  -- Validate PIN length (4-8 digits)
  IF length(_pin) < 4 OR length(_pin) > 8 OR _pin !~ '^\d+$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_pin_format',
      'message', 'PIN must be 4-8 digits'
    );
  END IF;

  -- Hash the PIN
  v_hash := crypt(_pin, gen_salt('bf'));

  -- Upsert the role security record
  INSERT INTO public.buyer_role_security (user_id, role, role_pin_hash, updated_at)
  VALUES (_user_id, _role, v_hash, now())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET role_pin_hash = v_hash, updated_at = now();

  RETURN json_build_object(
    'success', true,
    'message', 'PIN set successfully'
  );
END;
$$;

-- Function to check if user has PIN configured for a role
CREATE OR REPLACE FUNCTION public.has_role_pin(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.buyer_role_security
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Function to log role switch
CREATE OR REPLACE FUNCTION public.log_role_switch(
  _user_id uuid,
  _target_role text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.role_verification_logs (user_id, target_role, action, metadata)
  VALUES (_user_id, _target_role, 'role_switch', _metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;