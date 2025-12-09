-- Add column to track early adopter status on subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_early_adopter BOOLEAN DEFAULT false;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS early_adopter_expires_at TIMESTAMP WITH TIME ZONE;

-- Create function to check and grant early adopter subscription
CREATE OR REPLACE FUNCTION public.check_early_adopter_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  current_count INTEGER;
BEGIN
  -- Get the role that was just assigned
  user_role := NEW.role;
  
  -- Only apply to suppliers and logistics partners
  IF user_role NOT IN ('supplier', 'logistics_partner') THEN
    RETURN NEW;
  END IF;
  
  -- Count existing suppliers and logistics partners (excluding current)
  SELECT COUNT(*) INTO current_count
  FROM user_roles
  WHERE role IN ('supplier', 'logistics_partner')
  AND user_id != NEW.user_id;
  
  -- If under 100, grant early adopter premium subscription
  IF current_count < 100 THEN
    -- Insert or update subscription with 1 year free premium
    INSERT INTO public.subscriptions (
      user_id, 
      tier, 
      bids_limit, 
      is_early_adopter,
      early_adopter_expires_at,
      billing_cycle_start
    )
    VALUES (
      NEW.user_id, 
      'premium', 
      999999, -- Effectively unlimited bids
      true,
      NOW() + INTERVAL '1 year',
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      tier = 'premium',
      bids_limit = 999999,
      is_early_adopter = true,
      early_adopter_expires_at = NOW() + INTERVAL '1 year',
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS grant_early_adopter_subscription ON public.user_roles;
CREATE TRIGGER grant_early_adopter_subscription
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_early_adopter_subscription();

-- Add unique constraint on user_id for subscriptions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;