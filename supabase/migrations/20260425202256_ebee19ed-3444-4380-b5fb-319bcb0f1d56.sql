-- register_session: deactivate-then-insert pattern.
-- The unique index `one_active_session_per_user` is partial (WHERE active = true),
-- so we cannot use ON CONFLICT against it portably. Instead we atomically flip any
-- prior active row to inactive, then insert the new active row. The whole function
-- runs in a single transaction.

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
  v_session_id text := gen_random_uuid()::text;
BEGIN
  -- Last-write-wins: retire any existing active session for this user.
  UPDATE public.user_sessions
     SET active = false,
         last_seen_at = now()
   WHERE user_id = p_user_id
     AND active = true;

  INSERT INTO public.user_sessions (user_id, session_id, device_info, started_at, last_seen_at, active)
  VALUES (p_user_id, v_session_id, p_device_info, now(), now(), true);

  RETURN jsonb_build_object('session_id', v_session_id);
END;
$$;