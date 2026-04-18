
-- 1) ADD purchaser_id columns
ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS purchaser_id uuid;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS purchaser_id uuid;

CREATE INDEX IF NOT EXISTS idx_requirements_purchaser
  ON public.requirements (purchaser_id);

CREATE INDEX IF NOT EXISTS idx_po_purchaser
  ON public.purchase_orders (purchaser_id);

-- 2) BACKFILL
UPDATE public.requirements
SET purchaser_id = buyer_id
WHERE purchaser_id IS NULL AND buyer_id IS NOT NULL;

UPDATE public.purchase_orders po
SET purchaser_id = COALESCE(
  (SELECT r.purchaser_id FROM public.requirements r WHERE r.id = po.requirement_id),
  po.created_by
)
WHERE po.purchaser_id IS NULL;

-- 3) RFQ default trigger: purchaser_id := buyer_id when null
CREATE OR REPLACE FUNCTION public.set_rfq_purchaser_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.purchaser_id IS NULL THEN
    NEW.purchaser_id := NEW.buyer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rfq_purchaser_default ON public.requirements;
CREATE TRIGGER trg_rfq_purchaser_default
BEFORE INSERT ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.set_rfq_purchaser_default();

-- 4) PO consistency trigger: enforce purchaser matches the RFQ's purchaser
CREATE OR REPLACE FUNCTION public.enforce_po_purchaser_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rfq_purchaser uuid;
BEGIN
  IF NEW.requirement_id IS NOT NULL THEN
    SELECT purchaser_id INTO v_rfq_purchaser
    FROM public.requirements
    WHERE id = NEW.requirement_id;

    IF v_rfq_purchaser IS NOT NULL
       AND NEW.purchaser_id IS DISTINCT FROM v_rfq_purchaser THEN
      NEW.purchaser_id := v_rfq_purchaser;
    END IF;
  END IF;

  IF NEW.purchaser_id IS NULL THEN
    NEW.purchaser_id := NEW.created_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_po_purchaser_enforce ON public.purchase_orders;
CREATE TRIGGER trg_po_purchaser_enforce
BEFORE INSERT OR UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_po_purchaser_consistency();

-- 5) DASHBOARD FILTER FUNCTION
CREATE OR REPLACE FUNCTION public.get_scoped_pos_by_purchaser(
  p_user_id uuid,
  p_selected_purchaser uuid DEFAULT NULL
)
RETURNS SETOF public.purchase_orders
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company uuid;
BEGIN
  SELECT LOWER(role), company_id
    INTO v_role, v_company
  FROM public.buyer_company_members
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY
    CASE LOWER(role)
      WHEN 'ceo' THEN 1
      WHEN 'buyer_ceo' THEN 1
      WHEN 'cfo' THEN 2
      WHEN 'buyer_cfo' THEN 2
      WHEN 'director' THEN 3
      WHEN 'buyer_director' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'buyer_manager' THEN 4
      WHEN 'operations_manager' THEN 4
      WHEN 'purchase_head' THEN 5
      WHEN 'hr' THEN 5
      WHEN 'buyer_hr' THEN 5
      WHEN 'purchaser' THEN 6
      WHEN 'buyer_purchaser' THEN 6
      ELSE 9
    END
  LIMIT 1;

  IF v_role IN ('purchaser', 'buyer_purchaser') THEN
    RETURN QUERY
    SELECT * FROM public.purchase_orders
    WHERE purchaser_id = p_user_id;
  ELSE
    IF p_selected_purchaser IS NOT NULL THEN
      RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE po.purchaser_id = p_selected_purchaser
        AND (v_company IS NULL OR po.buyer_company_id = v_company);
    ELSE
      RETURN QUERY
      SELECT po.* FROM public.purchase_orders po
      WHERE (v_company IS NULL OR po.buyer_company_id = v_company);
    END IF;
  END IF;
END;
$$;

-- 6) TEAM MEMBERS HELPER
CREATE OR REPLACE FUNCTION public.get_company_team_members(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', m.user_id,
        'name', COALESCE(pr.contact_person, pr.company_name, 'Team Member'),
        'role', m.role,
        'is_current_user', m.user_id = p_user_id
      )
      ORDER BY (m.user_id = p_user_id) DESC, m.role
    ),
    '[]'::jsonb
  )
  FROM public.buyer_company_members m
  LEFT JOIN public.profiles pr ON pr.id = m.user_id
  WHERE m.is_active = true
    AND m.company_id IN (
      SELECT company_id
      FROM public.buyer_company_members
      WHERE user_id = p_user_id AND is_active = true
    );
$$;
