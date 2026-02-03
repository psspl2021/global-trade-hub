-- 1️⃣ Ensure session_id column exists in buyer_activation_signals
ALTER TABLE public.buyer_activation_signals
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 2️⃣ Index for dedup & performance
CREATE INDEX IF NOT EXISTS idx_buyer_activation_session_time
ON public.buyer_activation_signals(session_id, created_at DESC);

-- 3️⃣ Fixed Buyer Activation Trigger Function (correct dedup logic)
CREATE OR REPLACE FUNCTION public.trigger_buyer_activation_signal()
RETURNS TRIGGER AS $$
DECLARE
  draft_count INTEGER;
  trigger_type TEXT;
  score INTEGER;
  existing_signal_count INTEGER;
BEGIN
  -- Only draft RFQs
  IF NEW.status <> 'draft' THEN
    RETURN NEW;
  END IF;

  -- Prevent duplicate activation within 24h (SESSION BASED)
  SELECT COUNT(*) INTO existing_signal_count
  FROM public.buyer_activation_signals
  WHERE session_id = NEW.session_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF existing_signal_count > 0 THEN
    RAISE LOG '[BuyerActivation] Duplicate prevented for session %', NEW.session_id;
    RETURN NEW;
  END IF;

  -- Count drafts in last 24 hours
  SELECT COUNT(*) INTO draft_count
  FROM public.rfq_drafts
  WHERE status = 'draft'
    AND session_id = NEW.session_id
    AND created_at > NOW() - INTERVAL '24 hours';

  -- Decide signal strength
  IF draft_count >= 2 THEN
    trigger_type := 'repeat_draft';
    score := 85;
  ELSE
    trigger_type := 'rfq_abandon';
    score := 70;
  END IF;

  -- Insert buyer activation signal
  INSERT INTO public.buyer_activation_signals (
    user_id,
    session_id,
    trigger_reason,
    category_slug,
    confidence_score,
    created_at
  ) VALUES (
    NEW.user_id,
    NEW.session_id,
    trigger_type,
    NEW.category_slug,
    score,
    NOW()
  );

  RAISE LOG '[BuyerActivation] Signal fired → %, score %', trigger_type, score;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4️⃣ Reattach trigger to rfq_drafts
DROP TRIGGER IF EXISTS on_rfq_draft_activation ON public.rfq_drafts;

CREATE TRIGGER on_rfq_draft_activation
AFTER INSERT ON public.rfq_drafts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_buyer_activation_signal();