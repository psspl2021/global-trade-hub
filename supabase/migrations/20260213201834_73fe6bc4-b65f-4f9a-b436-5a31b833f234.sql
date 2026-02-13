
-- STEP 1: Harden CHECK constraint (allow NULL)
ALTER TABLE demand_intelligence_signals
DROP CONSTRAINT IF EXISTS demand_intelligence_signals_decision_action_check;

ALTER TABLE demand_intelligence_signals
ADD CONSTRAINT demand_intelligence_signals_decision_action_check
CHECK (
  decision_action IS NULL
  OR decision_action IN ('pending','approved','rejected')
);

-- STEP 2: Trigger to block invalid decision_action writes
CREATE OR REPLACE FUNCTION block_invalid_decision_action()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.decision_action IS NOT NULL
     AND NEW.decision_action NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION
      'Invalid decision_action %. Use RPC activate_demand_lane()',
      NEW.decision_action;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_invalid_decision_action
ON demand_intelligence_signals;

CREATE TRIGGER trg_block_invalid_decision_action
BEFORE INSERT OR UPDATE ON demand_intelligence_signals
FOR EACH ROW
EXECUTE FUNCTION block_invalid_decision_action();

-- STEP 3: Canonical RPC (final version)
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
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND');
  END IF;

  IF sig.lane_state IN ('closed','lost') THEN
    RETURN jsonb_build_object('success', false, 'code', 'TERMINAL');
  END IF;

  IF sig.lane_state IN ('activated','fulfilling') THEN
    RETURN jsonb_build_object('success', false, 'code', 'ALREADY_ACTIVE');
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
    occurred_at
  ) VALUES (
    p_signal_id,
    'LANE_ACTIVATED',
    sig.country,
    sig.category,
    COALESCE(sig.lane_state,'detected'),
    'activated',
    'admin',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'signal_id', p_signal_id,
    'lane_state', 'activated'
  );
END;
$$;
