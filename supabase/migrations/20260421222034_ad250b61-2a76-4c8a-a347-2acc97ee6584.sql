-- Auction PO Approval Workflow: Manager → Purchase Head (Head of Procurement)
-- Scope: po_source = 'auction' only

-- 1) Resolve buyer company for a PO via the purchaser
CREATE OR REPLACE FUNCTION public.get_po_buyer_company_id(_po_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.company_id
  FROM purchase_orders p
  JOIN buyer_company_members m
    ON m.user_id = COALESCE(p.purchaser_id, p.created_by)
   AND m.is_active = true
  WHERE p.id = _po_id
  ORDER BY CASE WHEN m.user_id = p.purchaser_id THEN 0 ELSE 1 END
  LIMIT 1;
$$;

-- 2) Helper: does the caller hold a given role in the PO's buyer company?
CREATE OR REPLACE FUNCTION public.user_has_company_role_for_po(_po_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM purchase_orders p
    JOIN buyer_company_members me
      ON me.user_id = auth.uid()
     AND me.is_active = true
    JOIN buyer_company_members owner
      ON owner.user_id = COALESCE(p.purchaser_id, p.created_by)
     AND owner.is_active = true
     AND owner.company_id = me.company_id
    WHERE p.id = _po_id
      AND lower(me.role) = ANY (_roles)
  );
$$;

-- 3) Trigger: gate auction-derived POs into the approval queue on creation
CREATE OR REPLACE FUNCTION public.enforce_auction_po_approval_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.po_source = 'auction' THEN
    -- Force into pending approval regardless of what the client sent
    NEW.approval_status := 'pending_manager';
    NEW.po_status := 'pending_approval';
    NEW.status := 'draft';
    NEW.approval_required := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auction_po_approval_gate ON public.purchase_orders;
CREATE TRIGGER trg_auction_po_approval_gate
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_auction_po_approval_on_insert();

-- 4) Manager approval RPC
CREATE OR REPLACE FUNCTION public.approve_po_as_manager(_po_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_idem text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the PO row
  SELECT * INTO v_po FROM purchase_orders WHERE id = _po_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PO not found';
  END IF;

  IF v_po.po_source <> 'auction' THEN
    RAISE EXCEPTION 'This approval flow only applies to auction POs';
  END IF;

  IF v_po.approval_status <> 'pending_manager' THEN
    RAISE EXCEPTION 'PO is not awaiting manager approval (current: %)', v_po.approval_status;
  END IF;

  IF NOT public.user_has_company_role_for_po(_po_id, ARRAY['manager','buyer_manager','operations_manager']) THEN
    RAISE EXCEPTION 'You do not have Manager rights for this PO';
  END IF;

  v_idem := 'mgr-approve-' || _po_id::text;

  UPDATE purchase_orders
     SET approval_status = 'pending_purchase_head',
         manager_approved_by = auth.uid(),
         manager_approved_at = now(),
         updated_at = now()
   WHERE id = _po_id;

  INSERT INTO po_approval_logs (po_id, action, performed_by, metadata, idempotency_key)
  VALUES (_po_id, 'manager_approved', auth.uid(),
          jsonb_build_object('notes', _notes, 'next_stage', 'pending_purchase_head'), v_idem)
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'next_stage', 'pending_purchase_head');
END;
$$;

-- 5) Purchase Head approval RPC — final stage; flips PO to 'sent'
CREATE OR REPLACE FUNCTION public.approve_po_as_purchase_head(_po_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_idem text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_po FROM purchase_orders WHERE id = _po_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PO not found';
  END IF;

  IF v_po.po_source <> 'auction' THEN
    RAISE EXCEPTION 'This approval flow only applies to auction POs';
  END IF;

  IF v_po.approval_status <> 'pending_purchase_head' THEN
    RAISE EXCEPTION 'PO is not awaiting Head of Procurement approval (current: %)', v_po.approval_status;
  END IF;

  IF NOT public.user_has_company_role_for_po(_po_id, ARRAY['purchase_head']) THEN
    RAISE EXCEPTION 'You do not have Head of Procurement rights for this PO';
  END IF;

  v_idem := 'head-approve-' || _po_id::text;

  UPDATE purchase_orders
     SET approval_status = 'approved',
         director_approved_by = auth.uid(),
         director_approved_at = now(),
         po_status = 'sent',
         status = 'sent',
         updated_at = now()
   WHERE id = _po_id;

  INSERT INTO po_approval_logs (po_id, action, performed_by, metadata, idempotency_key)
  VALUES (_po_id, 'purchase_head_approved', auth.uid(),
          jsonb_build_object('notes', _notes, 'next_stage', 'approved'), v_idem)
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'next_stage', 'approved', 'sent_to_supplier', true);
END;
$$;

-- 6) Rejection RPC (either stage)
CREATE OR REPLACE FUNCTION public.reject_po_approval(_po_id uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_stage text;
  v_idem text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF coalesce(trim(_reason),'') = '' THEN RAISE EXCEPTION 'Rejection reason required'; END IF;

  SELECT * INTO v_po FROM purchase_orders WHERE id = _po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PO not found'; END IF;

  IF v_po.approval_status NOT IN ('pending_manager','pending_purchase_head') THEN
    RAISE EXCEPTION 'PO is not in an approvable stage (current: %)', v_po.approval_status;
  END IF;

  IF v_po.approval_status = 'pending_manager' THEN
    IF NOT public.user_has_company_role_for_po(_po_id, ARRAY['manager','buyer_manager','operations_manager']) THEN
      RAISE EXCEPTION 'Not authorized to reject at manager stage';
    END IF;
    v_stage := 'manager_rejected';
  ELSE
    IF NOT public.user_has_company_role_for_po(_po_id, ARRAY['purchase_head']) THEN
      RAISE EXCEPTION 'Not authorized to reject at Head of Procurement stage';
    END IF;
    v_stage := 'purchase_head_rejected';
  END IF;

  v_idem := v_stage || '-' || _po_id::text;

  UPDATE purchase_orders
     SET approval_status = 'rejected',
         po_status = 'rejected',
         status = 'rejected',
         rejected_by = auth.uid(),
         rejected_at = now(),
         rejection_reason = _reason,
         updated_at = now()
   WHERE id = _po_id;

  INSERT INTO po_approval_logs (po_id, action, performed_by, metadata, idempotency_key)
  VALUES (_po_id, v_stage, auth.uid(), jsonb_build_object('reason', _reason), v_idem)
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'status', 'rejected');
END;
$$;

-- 7) Idempotency-safe constraint
CREATE UNIQUE INDEX IF NOT EXISTS po_approval_logs_idem_key
  ON public.po_approval_logs (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 8) RLS: let Manager / Purchase Head of the same buyer company SEE pending POs
--    (Existing po_management_company already covers most senior roles, but be explicit.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='purchase_orders' AND policyname='po_approvers_visibility'
  ) THEN
    CREATE POLICY po_approvers_visibility
    ON public.purchase_orders
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM buyer_company_members me
        JOIN buyer_company_members owner
          ON owner.user_id = COALESCE(purchase_orders.purchaser_id, purchase_orders.created_by)
         AND owner.is_active = true
         AND owner.company_id = me.company_id
        WHERE me.user_id = auth.uid()
          AND me.is_active = true
          AND lower(me.role) IN ('manager','buyer_manager','operations_manager','purchase_head')
      )
    );
  END IF;
END$$;

-- 9) RLS on po_approval_logs (read for involved company members; writes via SECURITY DEFINER funcs)
ALTER TABLE public.po_approval_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='po_approval_logs' AND policyname='po_approval_logs_company_read') THEN
    CREATE POLICY po_approval_logs_company_read
    ON public.po_approval_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM purchase_orders p
        JOIN buyer_company_members me ON me.user_id = auth.uid() AND me.is_active = true
        JOIN buyer_company_members owner
          ON owner.user_id = COALESCE(p.purchaser_id, p.created_by)
         AND owner.is_active = true
         AND owner.company_id = me.company_id
        WHERE p.id = po_approval_logs.po_id
      )
    );
  END IF;
END$$;