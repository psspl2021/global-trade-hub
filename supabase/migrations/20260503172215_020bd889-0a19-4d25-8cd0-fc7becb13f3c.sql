
INSERT INTO public.profiles (id, email, contact_person, company_name)
SELECT u.id,
       u.email,
       COALESCE(
         NULLIF(u.raw_user_meta_data->>'contact_person',''),
         NULLIF(u.raw_user_meta_data->>'full_name',''),
         split_part(u.email,'@',1)
       ),
       COALESCE(bc.company_name, split_part(u.email,'@',1)) || ' · ' || split_part(u.email,'@',1)
FROM auth.users u
JOIN public.buyer_company_members m ON m.user_id = u.id
LEFT JOIN public.buyer_companies bc ON bc.id = m.company_id
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

UPDATE public.team_invites ti
SET status = 'accepted'
FROM auth.users u
JOIN public.buyer_company_members m ON m.user_id = u.id AND m.is_active = true
WHERE lower(btrim(ti.email)) = lower(btrim(u.email))
  AND ti.company_id = m.company_id
  AND ti.status = 'pending';

CREATE OR REPLACE FUNCTION public.get_company_purchasers(_user_id uuid)
RETURNS TABLE(member_id uuid, user_id uuid, display_name text, email text, role text, assigned_categories text[], is_current_user boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    bcm.id AS member_id,
    bcm.user_id,
    COALESCE(
      NULLIF(TRIM(p.contact_person), ''),
      split_part(COALESCE(p.email, au.email, ''), '@', 1),
      'Member'
    ) AS display_name,
    COALESCE(p.email, au.email) AS email,
    bcm.role,
    bcm.assigned_categories,
    (bcm.user_id = _user_id) AS is_current_user
  FROM public.buyer_company_members bcm
  LEFT JOIN public.profiles p ON p.id = bcm.user_id
  LEFT JOIN auth.users au ON au.id = bcm.user_id
  WHERE bcm.is_active = true
    AND bcm.company_id IN (
      SELECT company_id FROM public.buyer_company_members
      WHERE user_id = _user_id AND is_active = true
    )
    AND bcm.role IN (
      'buyer_purchaser','buyer_manager','buyer_cfo','buyer_ceo','buyer_hr',
      'buyer_purchase_head','buyer_vp','buyer_director','buyer_operations_manager',
      'buyer_admin','buyer'
    );
$function$;
