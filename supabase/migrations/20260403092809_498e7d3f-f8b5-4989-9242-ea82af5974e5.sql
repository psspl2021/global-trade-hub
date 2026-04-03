
-- Auto-provision 5 free auction credits for new buyers
CREATE OR REPLACE FUNCTION public.provision_free_auction_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.buyer_auction_credits (buyer_id, total_credits, used_credits)
  VALUES (NEW.id, 5, 0)
  ON CONFLICT (buyer_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on profile creation
DROP TRIGGER IF EXISTS trg_provision_free_auction_credits ON public.profiles;
CREATE TRIGGER trg_provision_free_auction_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_free_auction_credits();

-- Provision 5 free credits for existing buyers who don't have any credits yet
INSERT INTO public.buyer_auction_credits (buyer_id, total_credits, used_credits)
SELECT p.id, 5, 0
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.buyer_auction_credits bac WHERE bac.buyer_id = p.id
);
