ALTER TABLE public.buyer_role_security
  DROP CONSTRAINT IF EXISTS buyer_role_security_role_check;

ALTER TABLE public.buyer_role_security
  ADD CONSTRAINT buyer_role_security_role_check
  CHECK (
    role IN (
      'buyer_cfo',
      'buyer_ceo',
      'buyer_hr',
      'buyer_manager',
      'buyer_purchase_head',
      'buyer_vp'
    )
  );