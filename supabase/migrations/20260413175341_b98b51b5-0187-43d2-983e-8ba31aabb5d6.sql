
-- Drop old index if exists
DROP INDEX IF EXISTS one_active_session_per_user;
DROP INDEX IF EXISTS idx_user_sessions_user_active;

-- Ensure columns exist
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS device_info TEXT,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();

-- Clean up: deactivate all currently active sessions to reset state
UPDATE public.user_sessions SET active = false WHERE active = true;

-- Create unique index: only 1 active session per user
CREATE UNIQUE INDEX one_active_session_per_user
ON public.user_sessions(user_id)
WHERE active = true;

-- New register_session: auto-evict old sessions, always succeed
CREATE OR REPLACE FUNCTION public.register_session(
  p_user_id UUID,
  p_device_info TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Clean stale sessions (> 24h inactive)
  DELETE FROM user_sessions
  WHERE user_id = p_user_id
    AND active = false
    AND last_seen_at < now() - interval '24 hours';

  -- Deactivate any existing active session for this user
  UPDATE user_sessions
  SET active = false
  WHERE user_id = p_user_id AND active = true;

  -- Insert new active session
  INSERT INTO user_sessions (user_id, device_info, active, last_seen_at)
  VALUES (p_user_id, p_device_info, true, now())
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'session_id', v_session_id
  );
END;
$$;

-- Keep deactivate_user_sessions for explicit sign-out
CREATE OR REPLACE FUNCTION public.deactivate_user_sessions(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_sessions
  SET active = false
  WHERE user_id = p_user_id AND active = true;
END;
$$;
