-- Seed minimum capabilities for buyer_purchaser so their dashboard is not blank
INSERT INTO public.role_capabilities (role, capability) VALUES
  ('buyer_purchaser', 'can_create_rfq'),
  ('buyer_purchaser', 'can_view_own_data'),
  ('buyer_purchaser', 'can_view_own_pos'),
  ('buyer_purchaser', 'can_view_own_quotes'),
  ('buyer_purchaser', 'can_view_own_auctions')
ON CONFLICT (role, capability) DO NOTHING;

-- Mirror to legacy 'purchaser' role for safety
INSERT INTO public.role_capabilities (role, capability) VALUES
  ('purchaser', 'can_create_rfq'),
  ('purchaser', 'can_view_own_data'),
  ('purchaser', 'can_view_own_pos'),
  ('purchaser', 'can_view_own_quotes'),
  ('purchaser', 'can_view_own_auctions')
ON CONFLICT (role, capability) DO NOTHING;