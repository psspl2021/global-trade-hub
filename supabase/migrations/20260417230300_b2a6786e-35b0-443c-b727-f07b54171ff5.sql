
-- =========================================================
-- 1) JOIN TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_purchasers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner','collaborator')),
  added_by uuid,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (po_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_po_purchasers_po
  ON public.purchase_order_purchasers (po_id);
CREATE INDEX IF NOT EXISTS idx_po_purchasers_user
  ON public.purchase_order_purchasers (user_id);

ALTER TABLE public.purchase_order_purchasers ENABLE ROW LEVEL SECURITY;

-- Read: anyone in the same company as the PO
DROP POLICY IF EXISTS "po_purchasers_company_read" ON public.purchase_order_purchasers;
CREATE POLICY "po_purchasers_company_read"
ON public.purchase_order_purchasers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.purchase_orders po
    JOIN public.user_company_access uca
      ON uca.company_id = po.buyer_company_id
    WHERE po.id = purchase_order_purchasers.po_id
      AND uca.user_id = auth.uid()
  )
);

-- Write: only CEO/CFO/Director of the same company
DROP POLICY IF EXISTS "po_purchasers_admin_write" ON public.purchase_order_purchasers;
CREATE POLICY "po_purchasers_admin_write"
ON public.purchase_order_purchasers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.purchase_orders po
    JOIN public.user_company_access uca
      ON uca.company_id = po.buyer_company_id
    WHERE po.id = purchase_order_purchasers.po_id
      AND uca.user_id = auth.uid()
      AND LOWER(uca.role) IN ('ceo','cfo','director')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.purchase_orders po
    JOIN public.user_company_access uca
      ON uca.company_id = po.buyer_company_id
    WHERE po.id = purchase_order_purchasers.po_id
      AND uca.user_id = auth.uid()
      AND LOWER(uca.role) IN ('ceo','cfo','director')
  )
);

-- =========================================================
-- 2) AUTO-ADD CREATOR AS OWNER
-- =========================================================
CREATE OR REPLACE FUNCTION public.ensure_po_creator_as_purchaser()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.purchase_order_purchasers (po_id, user_id, role, added_by)
    VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by)
    ON CONFLICT (po_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_po_add_creator_purchaser ON public.purchase_orders;
CREATE TRIGGER trg_po_add_creator_purchaser
AFTER INSERT ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.ensure_po_creator_as_purchaser();

-- =========================================================
-- 3) ADD MULTIPLE PURCHASERS RPC
-- =========================================================
CREATE OR REPLACE FUNCTION public.add_po_purchasers(
  p_po_id uuid,
  p_user_ids uuid[]
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_caller_role text;
  v_inserted int := 0;
BEGIN
  SELECT buyer_company_id INTO v_company
  FROM public.purchase_orders WHERE id = p_po_id;

  IF v_company IS NULL THEN
    RAISE EXCEPTION 'PO not found';
  END IF;

  SELECT LOWER(role) INTO v_caller_role
  FROM public.user_company_access
  WHERE user_id = auth.uid() AND company_id = v_company
  ORDER BY
    CASE LOWER(role)
      WHEN 'ceo' THEN 1 WHEN 'cfo' THEN 2 WHEN 'director' THEN 3 ELSE 9 END
  LIMIT 1;

  IF v_caller_role NOT IN ('ceo','cfo','director') THEN
    RAISE EXCEPTION 'Only CEO/CFO/Director can manage purchasers';
  END IF;

  WITH ins AS (
    INSERT INTO public.purchase_order_purchasers (po_id, user_id, role, added_by)
    SELECT p_po_id, uid, 'collaborator', auth.uid()
    FROM unnest(p_user_ids) AS uid
    WHERE EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = uid AND uca.company_id = v_company
    )
    ON CONFLICT (po_id, user_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM ins;

  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_po_purchaser(
  p_po_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_caller_role text;
  v_deleted int;
BEGIN
  SELECT buyer_company_id INTO v_company
  FROM public.purchase_orders WHERE id = p_po_id;
  IF v_company IS NULL THEN RETURN false; END IF;

  SELECT LOWER(role) INTO v_caller_role
  FROM public.user_company_access
  WHERE user_id = auth.uid() AND company_id = v_company
  ORDER BY
    CASE LOWER(role) WHEN 'ceo' THEN 1 WHEN 'cfo' THEN 2 WHEN 'director' THEN 3 ELSE 9 END
  LIMIT 1;

  IF v_caller_role NOT IN ('ceo','cfo','director') THEN
    RAISE EXCEPTION 'Only CEO/CFO/Director can manage purchasers';
  END IF;

  DELETE FROM public.purchase_order_purchasers
  WHERE po_id = p_po_id
    AND user_id = p_user_id
    AND role <> 'owner';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

-- =========================================================
-- 4) APPROVER RESOLUTION — multi-purchaser aware
--    Priority: explicit manager_approver_id (still wins)
--              -> highest-ranked role across PO purchasers
--              -> company-level manager
--              -> creator fallback
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_po_approver(p_po_id uuid)
RETURNS TABLE(approver_id uuid, source text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_po RECORD;
BEGIN
  SELECT id, manager_approver_id, created_by, buyer_company_id
  INTO v_po
  FROM public.purchase_orders
  WHERE id = p_po_id;

  IF NOT FOUND THEN RETURN; END IF;

  -- 1) Explicit approver
  IF v_po.manager_approver_id IS NOT NULL THEN
    approver_id := v_po.manager_approver_id;
    source := 'manager_approver';
    RETURN NEXT; RETURN;
  END IF;

  -- 2) Highest-ranked accountable purchaser on this PO
  SELECT pop.user_id INTO approver_id
  FROM public.purchase_order_purchasers pop
  JOIN public.user_company_access uca
    ON uca.user_id = pop.user_id
   AND uca.company_id = v_po.buyer_company_id
  WHERE pop.po_id = p_po_id
    AND LOWER(uca.role) IN ('cfo','director','manager')
  ORDER BY
    CASE LOWER(uca.role)
      WHEN 'cfo' THEN 1
      WHEN 'director' THEN 2
      WHEN 'manager' THEN 3
      ELSE 9
    END,
    pop.added_at ASC
  LIMIT 1;

  IF approver_id IS NOT NULL THEN
    source := 'po_purchaser';
    RETURN NEXT; RETURN;
  END IF;

  -- 3) Company-level manager
  SELECT bcm.user_id INTO approver_id
  FROM public.buyer_company_members bcm
  WHERE bcm.company_id = v_po.buyer_company_id
    AND bcm.role = 'manager'
    AND bcm.is_active = true
  ORDER BY bcm.created_at ASC
  LIMIT 1;

  IF approver_id IS NOT NULL THEN
    source := 'company_manager';
    RETURN NEXT; RETURN;
  END IF;

  -- 4) Creator fallback
  approver_id := v_po.created_by;
  source := 'creator_fallback';
  RETURN NEXT;
END;
$function$;

-- =========================================================
-- 5) HELPER: purchasers per PO
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_po_purchasers(p_po_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', pr.id,
        'name', COALESCE(pr.company_name, pr.contact_person, 'User ' || LEFT(pr.id::text,6)),
        'role', pop.role
      ) ORDER BY (pop.role = 'owner') DESC, pop.added_at ASC
    ),
    '[]'::jsonb
  )
  FROM public.purchase_order_purchasers pop
  JOIN public.profiles pr ON pr.id = pop.user_id
  WHERE pop.po_id = p_po_id;
$$;

-- =========================================================
-- 6) BACKFILL EXISTING POs
-- =========================================================
INSERT INTO public.purchase_order_purchasers (po_id, user_id, role, added_by)
SELECT id, created_by, 'owner', created_by
FROM public.purchase_orders
WHERE created_by IS NOT NULL
ON CONFLICT (po_id, user_id) DO NOTHING;

-- =========================================================
-- 7) PATCH get_company_intelligence_v2 to expose purchasers[]
--    AND aggregate accountability across the join table
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_company_intelligence_v2(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_company_ids uuid[];
  v_base_currency text := 'INR';
  v_summary jsonb;
  v_insights jsonb;
  v_pos jsonb;
  v_stage_counts jsonb;
  v_top_purchasers jsonb;
  v_total_pos int := 0;
  v_total_value numeric := 0;
  v_total_payable numeric := 0;
  v_payable_7d numeric := 0;
  v_overdue_count int := 0;
  v_overdue_value numeric := 0;
  v_override_count int := 0;
  v_flagged_count int := 0;
  v_pending_ack_count int := 0;
  v_paid_count int := 0;
  v_finalized_count int := 0;
BEGIN
  WITH ranked AS (
    SELECT
      uca.role,
      uca.company_id,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE LOWER(uca.role)
            WHEN 'ceo' THEN 1 WHEN 'cfo' THEN 2 WHEN 'director' THEN 3
            WHEN 'manager' THEN 4 WHEN 'purchaser' THEN 5 WHEN 'hr' THEN 6
            ELSE 9 END,
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

  IF v_role IS NULL OR v_company_ids IS NULL THEN
    RETURN jsonb_build_object(
      'role', NULL, 'error', 'NO_ROLE',
      'summary', jsonb_build_object('po_count',0,'total_payable',0,'overdue',0,'payable_7d',0)
    );
  END IF;

  SELECT COALESCE(bc.base_currency, 'INR') INTO v_base_currency
  FROM public.buyer_companies bc
  WHERE bc.id = v_company_ids[1] LIMIT 1;

  WITH base AS (
    SELECT
      po.id, po.po_number, po.po_value_base_currency, po.payment_due_date,
      po.payment_status, po.created_at, po.created_by, po.ceo_override,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND COALESCE(po.payment_status,'') <> 'paid') AS due_7d,
      (COALESCE(po.payment_status,'') <> 'paid') AS is_payable,
      public.get_po_lifecycle_stage(
        po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
      ) AS lifecycle_stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'po_id', id,
      'po_number', po_number,
      'amount', po_value_base_currency,
      'due_date', payment_due_date,
      'stage', lifecycle_stage,
      'purchasers', public.get_po_purchasers(id),
      'creator_id', created_by,
      'is_overdue', is_overdue,
      'ceo_override', ceo_override
    ) ORDER BY created_at DESC), '[]'::jsonb),
    COUNT(*),
    COALESCE(SUM(po_value_base_currency), 0),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE is_payable), 0),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE due_7d), 0),
    COUNT(*) FILTER (WHERE is_overdue),
    COALESCE(SUM(po_value_base_currency) FILTER (WHERE is_overdue), 0),
    COUNT(*) FILTER (WHERE ceo_override = true),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'FLAGGED'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'PENDING_ACK'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'PAID'),
    COUNT(*) FILTER (WHERE lifecycle_stage = 'FINALIZED')
  INTO v_pos, v_total_pos, v_total_value, v_total_payable, v_payable_7d,
       v_overdue_count, v_overdue_value, v_override_count, v_flagged_count,
       v_pending_ack_count, v_paid_count, v_finalized_count
  FROM base;

  WITH base AS (
    SELECT public.get_po_lifecycle_stage(
      po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
    ) AS stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  )
  SELECT COALESCE(jsonb_object_agg(stage, cnt), '{}'::jsonb)
  INTO v_stage_counts
  FROM (SELECT stage, COUNT(*) AS cnt FROM base GROUP BY stage) s;

  -- Accountability via join table (every linked purchaser shares attribution)
  WITH scoped AS (
    SELECT
      po.id AS po_id,
      po.po_value_base_currency,
      po.ceo_override,
      (po.payment_due_date IS NOT NULL
        AND po.payment_due_date < CURRENT_DATE
        AND COALESCE(po.payment_status,'') <> 'paid') AS is_overdue,
      public.get_po_lifecycle_stage(
        po.payment_status, po.manager_ack_at, po.approval_status, po.ceo_override
      ) AS stage
    FROM public.get_scoped_purchase_orders(p_user_id) po
  ),
  linked AS (
    SELECT
      pop.user_id AS purchaser_id,
      COALESCE(pr.company_name, pr.contact_person, 'User ' || LEFT(pop.user_id::text,6)) AS purchaser,
      s.po_value_base_currency,
      s.ceo_override,
      s.is_overdue,
      s.stage
    FROM scoped s
    JOIN public.purchase_order_purchasers pop ON pop.po_id = s.po_id
    LEFT JOIN public.profiles pr ON pr.id = pop.user_id
  )
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_top_purchasers
  FROM (
    SELECT
      purchaser_id,
      purchaser,
      COUNT(*)::int AS total_pos,
      COALESCE(SUM(po_value_base_currency), 0) AS total_value,
      COUNT(*) FILTER (WHERE is_overdue)::int AS overdue_count,
      COUNT(*) FILTER (WHERE stage IN ('PENDING_ACK','PENDING_APPROVAL','FLAGGED','CEO_OVERRIDE'))::int AS stuck_count,
      COUNT(*) FILTER (WHERE ceo_override = true)::int AS override_count
    FROM linked
    GROUP BY purchaser_id, purchaser
    ORDER BY COALESCE(SUM(po_value_base_currency), 0) DESC
    LIMIT 10
  ) t;

  v_summary := jsonb_build_object(
    'po_count', v_total_pos,
    'total_payable', v_total_payable,
    'overdue', v_overdue_value,
    'payable_7d', v_payable_7d,
    'total_pos', v_total_pos,
    'total_value', v_total_value,
    'overdue_count', v_overdue_count,
    'overdue_value', v_overdue_value,
    'override_count', v_override_count,
    'flagged_count', v_flagged_count,
    'pending_ack_count', v_pending_ack_count,
    'paid_count', v_paid_count,
    'finalized_count', v_finalized_count,
    'base_currency', v_base_currency,
    'stage_counts', v_stage_counts
  );

  v_insights := jsonb_build_object(
    'top_purchasers', v_top_purchasers,
    'stage_counts', v_stage_counts,
    'note', 'Accountability resolved via purchase_order_purchasers join table'
  );

  RETURN jsonb_build_object(
    'role', v_role,
    'company_ids', to_jsonb(v_company_ids),
    'base_currency', v_base_currency,
    'summary', v_summary,
    'insights', v_insights,
    'pos', v_pos,
    'actions', '[]'::jsonb,
    'upcoming_payments', '[]'::jsonb,
    'empty', (v_total_pos = 0)
  );
END;
$function$;
