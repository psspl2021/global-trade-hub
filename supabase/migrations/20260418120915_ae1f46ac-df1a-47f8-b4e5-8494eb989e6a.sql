-- Add unique constraint on buyer_id so the provision_free_auction_credits trigger ON CONFLICT works
ALTER TABLE public.buyer_auction_credits
  ADD CONSTRAINT buyer_auction_credits_buyer_id_key UNIQUE (buyer_id);