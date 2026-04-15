
-- Table to track pending PO notifications (prevent duplicate reminders)
CREATE TABLE IF NOT EXISTS public.po_pending_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.reverse_auctions(id),
  buyer_company_id uuid NOT NULL REFERENCES public.buyer_companies(id),
  notified_at timestamptz NOT NULL DEFAULT now(),
  notification_count int NOT NULL DEFAULT 1,
  last_notified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auction_id)
);

ALTER TABLE public.po_pending_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their notifications"
  ON public.po_pending_notifications FOR SELECT
  USING (
    buyer_company_id IN (
      SELECT company_id FROM public.buyer_company_members WHERE user_id = auth.uid()
    )
  );

-- RLS: Allow buyer_cfo and buyer_ceo to manage team members
CREATE POLICY "CFO/CEO can manage company members"
  ON public.buyer_company_members FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.buyer_company_members
      WHERE user_id = auth.uid() AND role IN ('buyer_cfo', 'buyer_ceo', 'buyer_manager')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.buyer_company_members
      WHERE user_id = auth.uid() AND role IN ('buyer_cfo', 'buyer_ceo', 'buyer_manager')
    )
  );

-- Allow members to view their own company members
CREATE POLICY "Members can view company members"
  ON public.buyer_company_members FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.buyer_company_members WHERE user_id = auth.uid()
    )
  );

-- Function to find completed auctions without POs (for the notification edge function)
CREATE OR REPLACE FUNCTION public.get_pending_po_auctions()
RETURNS TABLE (
  auction_id uuid,
  auction_title text,
  buyer_id uuid,
  winning_price numeric,
  auction_end timestamptz,
  buyer_company_id uuid,
  approver_emails jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.id AS auction_id,
    ra.title AS auction_title,
    ra.buyer_id,
    ra.winning_price,
    ra.auction_end,
    bcm_buyer.company_id AS buyer_company_id,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'email', p.email,
        'role', bcm_approver.role,
        'name', p.contact_person
      ))
      FROM buyer_company_members bcm_approver
      JOIN profiles p ON p.id = bcm_approver.user_id
      WHERE bcm_approver.company_id = bcm_buyer.company_id
        AND bcm_approver.role IN ('buyer_manager', 'buyer_cfo', 'buyer_ceo')
        AND bcm_approver.is_active = true
    ) AS approver_emails
  FROM reverse_auctions ra
  JOIN buyer_company_members bcm_buyer ON bcm_buyer.user_id = ra.buyer_id
  LEFT JOIN purchase_orders po ON po.auction_id = ra.id
  WHERE ra.status = 'completed'
    AND ra.winning_price IS NOT NULL
    AND po.id IS NULL
    AND ra.auction_end < now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM po_pending_notifications ppn
      WHERE ppn.auction_id = ra.id
        AND ppn.last_notified_at > now() - interval '48 hours'
    );
END;
$$;
