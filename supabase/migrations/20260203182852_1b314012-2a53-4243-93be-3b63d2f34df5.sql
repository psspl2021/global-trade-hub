
-- Create function to automatically generate buyer activation signals
CREATE OR REPLACE FUNCTION public.trigger_buyer_activation_signal()
RETURNS TRIGGER AS $$
DECLARE
  draft_count INTEGER;
  trigger_type TEXT;
  score INTEGER;
  existing_signal_count INTEGER;
BEGIN
  -- Only process drafts
  IF NEW.status != 'draft' THEN
    RETURN NEW;
  END IF;

  -- Check for existing activation signal for this session in last 24 hours (idempotency)
  SELECT COUNT(*) INTO existing_signal_count
  FROM public.buyer_activation_signals
  WHERE (
    (NEW.session_id IS NOT NULL AND category_slug = NEW.session_id) -- Using category_slug to store session_id for dedup
    OR (NEW.user_id IS NOT NULL AND user_id = NEW.user_id)
  )
  AND created_at > NOW() - INTERVAL '24 hours'
  AND trigger_reason IN ('rfq_abandon', 'repeat_draft');

  IF existing_signal_count > 0 THEN
    -- Already have an activation signal for this session/user, skip
    RAISE LOG '[BuyerActivation] Skipping duplicate signal for session_id: %, user_id: %', NEW.session_id, NEW.user_id;
    RETURN NEW;
  END IF;

  -- Count drafts for this session/user in last 24 hours
  SELECT COUNT(*) INTO draft_count
  FROM public.rfq_drafts
  WHERE status = 'draft'
  AND created_at > NOW() - INTERVAL '24 hours'
  AND (
    (NEW.session_id IS NOT NULL AND session_id = NEW.session_id)
    OR (NEW.user_id IS NOT NULL AND user_id = NEW.user_id)
  );

  -- Determine trigger type and confidence score
  IF draft_count >= 2 THEN
    trigger_type := 'repeat_draft';
    score := 85;
    RAISE LOG '[BuyerActivation] Repeat draft detected (count: %) for session: %, user: %', draft_count, NEW.session_id, NEW.user_id;
  ELSE
    trigger_type := 'rfq_abandon';
    score := 70;
    RAISE LOG '[BuyerActivation] Single draft abandon for session: %, user: %', NEW.session_id, NEW.user_id;
  END IF;

  -- Insert activation signal
  INSERT INTO public.buyer_activation_signals (
    user_id,
    trigger_reason,
    category_slug,
    confidence_score,
    created_at
  ) VALUES (
    NEW.user_id,
    trigger_type,
    NEW.category_slug,
    score,
    NOW()
  );

  RAISE LOG '[BuyerActivation] Signal created: type=%, score=%, category=%', trigger_type, score, NEW.category_slug;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_rfq_draft_activation ON public.rfq_drafts;

-- Create trigger on rfq_drafts insert
CREATE TRIGGER on_rfq_draft_activation
  AFTER INSERT ON public.rfq_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_buyer_activation_signal();

-- Add index for performance on buyer_activation_signals lookups
CREATE INDEX IF NOT EXISTS idx_buyer_activation_signals_user_created 
ON public.buyer_activation_signals(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_buyer_activation_signals_trigger_reason 
ON public.buyer_activation_signals(trigger_reason, created_at DESC);
