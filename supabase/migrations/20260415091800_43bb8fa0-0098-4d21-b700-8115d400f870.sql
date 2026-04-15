
ALTER TABLE public.auction_messages
  ADD COLUMN IF NOT EXISTS reply_to_supplier_id uuid,
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES public.auction_messages(id);
