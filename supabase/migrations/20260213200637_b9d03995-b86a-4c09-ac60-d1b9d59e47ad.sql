
CREATE OR REPLACE FUNCTION public.activate_demand_lane(
  p_signal_id uuid,
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sig RECORD;
BEGIN
  SELECT * INTO sig
  FROM demand_intelligence_signals
  WHERE id = p_signal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Signal not found', 'code', 'NOT_FOUND');
  END IF;

  IF sig.lane_state IN ('closed','lost') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Terminal state', 'code', 'TERMINAL_STATE');
  END IF;

  IF sig.lane_state IN ('activated','fulfilling') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already active', 'code', 'ALREADY_ACTIVE');
  END IF;

  UPDATE demand_intelligence_signals
  SET
    lane_state = 'activated',
    decision_action = 'approved',
    activated_at = NOW(),
    decision_made_at = NOW(),
    decision_made_by = p_admin_id,
    updated_at = NOW()
  WHERE id = p_signal_id;

  INSERT INTO lane_events (
    signal_id,
    event_type,
    country,
    category,
    from_state,
    to_state,
    actor,
    occurred_at,
    metadata
  ) VALUES (
    p_signal_id,
    'LANE_ACTIVATED',
    sig.country,
    sig.category,
    COALESCE(sig.lane_state,'detected'),
    'activated',
    'admin',
    NOW(),
    jsonb_build_object('admin_id', p_admin_id::text)
  );

  RETURN jsonb_build_object(
    'success', true,
    'signal_id', p_signal_id,
    'lane_state', 'activated'
  );
END;
$$;
