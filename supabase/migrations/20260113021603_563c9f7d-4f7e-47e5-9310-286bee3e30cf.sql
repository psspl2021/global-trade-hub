-- Drop existing register_affiliate function first
DROP FUNCTION IF EXISTS public.register_affiliate(UUID);

-- Create activate_affiliate_fifo function for admin activation
CREATE OR REPLACE FUNCTION public.activate_affiliate_fifo(p_affiliate_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_active_count INT;
  v_position INT;
BEGIN
  -- Lock table to prevent race condition
  LOCK TABLE public.affiliates IN EXCLUSIVE MODE;

  -- Count active affiliates
  SELECT COUNT(*) INTO v_active_count
  FROM public.affiliates
  WHERE status = 'ACTIVE';

  -- If already full → reject
  IF v_active_count >= 50 THEN
    RETURN 'LIMIT_REACHED';
  END IF;

  -- Assign FIFO position
  SELECT COALESCE(MAX(queue_position), 0) + 1
  INTO v_position
  FROM public.affiliates;

  -- Activate affiliate
  UPDATE public.affiliates
  SET status = 'ACTIVE',
      activated_at = now(),
      queue_position = v_position,
      updated_at = now()
  WHERE id = p_affiliate_id;

  RETURN 'ACTIVATED';
END;
$$;

-- Recreate register_affiliate function with FIFO queue position
CREATE OR REPLACE FUNCTION public.register_affiliate(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_active_count INT;
  v_position INT;
  v_existing_status TEXT;
BEGIN
  -- Check if user already has an affiliate record
  SELECT status INTO v_existing_status
  FROM public.affiliates
  WHERE user_id = p_user_id;
  
  IF v_existing_status IS NOT NULL THEN
    RETURN 'ALREADY_REGISTERED:' || v_existing_status;
  END IF;

  -- Lock table to prevent race condition
  LOCK TABLE public.affiliates IN EXCLUSIVE MODE;

  SELECT COUNT(*) INTO v_active_count
  FROM public.affiliates
  WHERE status = 'ACTIVE';

  -- Assign FIFO position
  SELECT COALESCE(MAX(queue_position), 0) + 1
  INTO v_position
  FROM public.affiliates;

  IF v_active_count < 50 THEN
    INSERT INTO public.affiliates (user_id, status, queue_position, activated_at, joined_at)
    VALUES (p_user_id, 'ACTIVE', v_position, now(), now());
    RETURN 'ACTIVE';
  ELSE
    INSERT INTO public.affiliates (user_id, status, queue_position, joined_at)
    VALUES (p_user_id, 'WAITLISTED', v_position, now());
    RETURN 'WAITLISTED';
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.activate_affiliate_fifo(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_affiliate(UUID) TO authenticated;