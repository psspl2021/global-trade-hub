
-- 1. CFO Action Feedback (Learning Loop)
CREATE TABLE public.cfo_action_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_log_id UUID NOT NULL REFERENCES public.cfo_action_log(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  accepted BOOLEAN NOT NULL DEFAULT true,
  effectiveness_score NUMERIC(3,2),
  actual_impact NUMERIC(15,2),
  projected_impact NUMERIC(15,2),
  feedback_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(action_log_id)
);

ALTER TABLE public.cfo_action_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own company feedback"
  ON public.cfo_action_feedback FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.buyer_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Members can insert feedback for own company"
  ON public.cfo_action_feedback FOR INSERT TO authenticated
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.buyer_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Members can update own company feedback"
  ON public.cfo_action_feedback FOR UPDATE TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.buyer_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX idx_cfo_action_feedback_company ON public.cfo_action_feedback(company_id);
CREATE INDEX idx_cfo_action_feedback_action ON public.cfo_action_feedback(action_log_id);

-- 2. CFO Metrics Snapshots (Time-Series)
CREATE TABLE public.cfo_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  runway_days NUMERIC(8,2),
  daily_burn NUMERIC(15,2) DEFAULT 0,
  pending_payable NUMERIC(15,2) DEFAULT 0,
  overdue_amount NUMERIC(15,2) DEFAULT 0,
  burn_7d NUMERIC(15,2) DEFAULT 0,
  burn_30d NUMERIC(15,2) DEFAULT 0,
  total_exposure NUMERIC(15,2) DEFAULT 0,
  active_po_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, snapshot_date)
);

ALTER TABLE public.cfo_metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own company snapshots"
  ON public.cfo_metrics_snapshots FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.buyer_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX idx_cfo_snapshots_company_date ON public.cfo_metrics_snapshots(company_id, snapshot_date DESC);

-- 3. ERP Trigger on Payment Confirmation
CREATE OR REPLACE FUNCTION public.trigger_erp_sync_on_payment_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'payment_confirmed' AND (OLD.status IS DISTINCT FROM 'payment_confirmed') THEN
    INSERT INTO public.erp_sync_queue (entity_type, entity_id, sync_action, payload)
    VALUES (
      'purchase_order',
      NEW.id,
      'payment_confirmed',
      jsonb_build_object(
        'po_id', NEW.id,
        'buyer_id', NEW.buyer_id,
        'supplier_id', NEW.supplier_id,
        'total_amount', NEW.total_amount,
        'confirmed_at', now()
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_erp_sync_payment_confirmed ON public.purchase_orders;
CREATE TRIGGER trg_erp_sync_payment_confirmed
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_erp_sync_on_payment_confirmed();
