BEGIN;

-- 1. Revoke direct table reads from authenticated role
REVOKE ALL ON public.reverse_auctions FROM authenticated;

-- 2. Ensure RLS is on
ALTER TABLE public.reverse_auctions ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing SELECT policies (cleanup)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='reverse_auctions' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reverse_auctions', r.policyname);
  END LOOP;
END $$;

-- 4. Supplier-side read policy (only allowed direct-read path)
CREATE POLICY "supplier_can_view_invited_auctions"
ON public.reverse_auctions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reverse_auction_suppliers ras
    WHERE ras.auction_id = reverse_auctions.id
      AND (ras.supplier_id = auth.uid()
           OR ras.supplier_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

COMMIT;