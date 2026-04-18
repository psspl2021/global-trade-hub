CREATE OR REPLACE FUNCTION public.get_company_purchasers(_user_id uuid)
 RETURNS TABLE(member_id uuid, user_id uuid, display_name text, role text, assigned_categories text[], is_current_user boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    bcm.id AS member_id,
    bcm.user_id,
    COALESCE(p.contact_person, p.company_name, 'Member') AS display_name,
    bcm.role,
    bcm.assigned_categories,
    (bcm.user_id = _user_id) AS is_current_user
  FROM public.buyer_company_members bcm
  JOIN public.profiles p ON p.id = bcm.user_id
  WHERE bcm.company_id IN (
    SELECT company_id FROM public.buyer_company_members WHERE user_id = _user_id
  )
  AND bcm.role IN (
    'buyer_purchaser','purchaser','buyer',
    'buyer_manager','buyer_cfo','buyer_ceo','buyer_hr'
  )
  AND bcm.is_active = true
  ORDER BY (bcm.user_id = _user_id) DESC, p.contact_person ASC;
$function$;