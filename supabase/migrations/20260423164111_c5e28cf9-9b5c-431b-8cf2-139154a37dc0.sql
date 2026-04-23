DO $$
DECLARE
  target_ids uuid[] := ARRAY[
    'd4971ac5-595f-4360-88ce-1b32a5ebdad3'::uuid,
    'b4a9280c-241d-445a-b6a4-c87a18c30ee5'::uuid,
    '58ff38de-c6a7-48f5-a4e4-f9e37ee3665b'::uuid
  ];
  target_emails text[] := ARRAY[
    'credsewa@gmail.com',
    'info@industrymro.com',
    'akpksbk1005@gmail.com'
  ];
BEGIN
  DELETE FROM public.buyer_company_members WHERE user_id = ANY(target_ids);
  DELETE FROM public.buyer_role_security  WHERE user_id = ANY(target_ids);
  DELETE FROM public.team_invites         WHERE lower(email) = ANY(SELECT lower(unnest(target_emails)));
  DELETE FROM public.profiles             WHERE id = ANY(target_ids) OR lower(email) = ANY(SELECT lower(unnest(target_emails)));
  DELETE FROM auth.users                  WHERE id = ANY(target_ids) OR lower(email) = ANY(SELECT lower(unnest(target_emails)));
END $$;