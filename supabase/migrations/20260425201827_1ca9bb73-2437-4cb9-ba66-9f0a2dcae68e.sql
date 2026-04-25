-- Make register_session idempotent: last-write-wins on (user_id)
-- Resolves "duplicate key value violates unique constraint one_active_session_per_user"
-- under concurrency (multi-tab login, token refresh overlap, re-login).

CREATE OR REPLACE FUNCTION public.register_session(
  p_user_id uuid,
  p_device_info text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid := gen_random_uuid();
BEGIN
  -- Atomic upsert: if a row already exists for this user, replace it.
  INSERT INTO public.active_sessions (user_id, session_id, device_info, last_seen_at, created_at)
  VALUES (p_user_id, v_session_id, p_device_info, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET session_id    = EXCLUDED.session_id,
        device_info   = EXCLUDED.device_info,
        last_seen_at  = now(),
        created_at    = now();

  RETURN jsonb_build_object('session_id', v_session_id);
END;
$$;