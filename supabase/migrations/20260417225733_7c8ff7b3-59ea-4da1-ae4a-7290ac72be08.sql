
CREATE OR REPLACE FUNCTION public.get_scoped_purchase_orders(p_user_id uuid)
RETURNS SETOF purchase_orders
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_team_ids uuid[];
BEGIN
  -- Deterministic role pick: highest authority first, then newest grant
  WITH ranked AS (
    SELECT
      uca.role,
      uca.company_id,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE LOWER(uca.role)
            WHEN 'ceo' THEN 1
            WHEN 'cfo' THEN 2
            WHEN 'director' THEN 3
            WHEN 'manager' THEN 4
            WHEN 'purchaser' THEN 5
            WHEN 'hr' THEN 6
            ELSE 9
          END,
          uca.created_at DESC NULLS LAST
      ) AS rn
    FROM public.user_company_access uca
    WHERE uca.user_id = p_user_id
  ),
  picked AS (SELECT role FROM ranked WHERE rn = 1)
  SELECT p.role, ARRAY_AGG(r.company_id)
  INTO v_role, v_company_ids
  FROM picked p
  JOIN public.user_company_access r
    ON r.user_id = p_user_id AND r.role = p.role
  GROUP BY p.role;

  IF v_company_ids IS NULL OR array_length(v_company_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'manager' THEN
    SELECT array_agg(purchaser_id)
    INTO v_team_ids
    FROM public.manager_team_mapping
    WHERE manager_id = p_user_id;
  END IF;

  RETURN QUERY
  SELECT po.*
  FROM public.purchase_orders po
  WHERE
    po.buyer_company_id = ANY(v_company_ids)
    AND (
      (v_role IN ('ceo','cfo','hr','director'))
      OR (v_role = 'manager' AND v_team_ids IS NOT NULL AND po.created_by = ANY(v_team_ids))
      OR (v_role = 'purchaser' AND po.created_by = p_user_id)
    );
END;
$function$;
