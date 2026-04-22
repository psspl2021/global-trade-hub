CREATE OR REPLACE FUNCTION public.sync_po_status_on_terminal_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status IN ('approved','finalized')
     AND COALESCE(OLD.approval_status,'') NOT IN ('approved','finalized')
     AND COALESCE(NEW.po_status,'') = 'pending_approval' THEN
    -- Use lifecycle-valid initial state so supplier inbox can see it
    -- (supplier inbox hides only 'pending_approval' and 'rejected').
    NEW.po_status := 'CREATED';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_po_status_on_terminal_approval ON public.purchase_orders;
CREATE TRIGGER trg_sync_po_status_on_terminal_approval
BEFORE UPDATE OF approval_status ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_po_status_on_terminal_approval();

-- Backfill: any PO already approved but stuck on pending_approval.
UPDATE public.purchase_orders
   SET po_status = 'CREATED',
       updated_at = now()
 WHERE approval_status IN ('approved','finalized')
   AND po_status = 'pending_approval';