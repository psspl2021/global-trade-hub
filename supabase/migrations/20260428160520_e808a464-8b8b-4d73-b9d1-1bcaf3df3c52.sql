-- Cleanup: remove stray buyer_manager roles from users who signed up as affiliate
-- (caused by old handle_new_user trigger before the affiliate exclusion fix)
DELETE FROM public.user_roles ur
USING auth.users au
WHERE ur.user_id = au.id
  AND ur.role = 'buyer_manager'
  AND au.raw_user_meta_data->>'role' = 'affiliate'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = au.id AND ur2.role = 'affiliate'
  );