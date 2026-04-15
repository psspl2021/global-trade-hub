
-- Fix set_role_pin to use schema-qualified pgcrypto functions
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
  IF length(_pin) < 4 OR length(_pin) > 8 OR _pin !~ '^\d+$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_pin_format',
      'message', 'PIN must be 4-8 digits'
    );
  END IF;

  v_hash := extensions.crypt(_pin, extensions.gen_salt('bf'));

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

-- Fix verify_role_pin to use schema-qualified pgcrypto functions
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
  SELECT role_pin_hash INTO v_stored_hash
  FROM public.buyer_role_security
  WHERE user_id = _user_id AND role = _role;

  IF v_stored_hash IS NULL THEN
    INSERT INTO public.role_verification_logs (user_id, target_role, action, metadata)
    VALUES (_user_id, _role, 'unlock_failure', '{"reason": "no_pin_configured"}'::jsonb);
    
    RETURN json_build_object(
      'success', false,
      'error', 'no_pin_configured',
      'message', 'No PIN configured for this role. Please set up a PIN first.'
    );
  END IF;

  v_is_valid := (v_stored_hash = extensions.crypt(_pin, v_stored_hash));

  IF v_is_valid THEN
    UPDATE public.buyer_role_security
    SET last_verified_at = now(), updated_at = now()
    WHERE user_id = _user_id AND role = _role;

    INSERT INTO public.role_verification_logs (user_id, target_role, action)
    VALUES (_user_id, _role, 'unlock_success')
    RETURNING id INTO v_log_id;

    RETURN json_build_object(
      'success', true,
      'verified_at', now(),
      'log_id', v_log_id
    );
  ELSE
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
