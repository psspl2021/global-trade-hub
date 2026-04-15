UPDATE public.purchase_orders po
SET buyer_company_id = bcm.company_id
FROM public.buyer_company_members bcm
WHERE po.created_by = bcm.user_id
  AND bcm.is_active = true
  AND po.buyer_company_id IS NULL;