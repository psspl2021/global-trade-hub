
-- 1️⃣ Add buyer_id column
ALTER TABLE public.demand_intelligence_signals
ADD COLUMN IF NOT EXISTS buyer_id uuid;

-- 2️⃣ Enable RLS
ALTER TABLE public.demand_intelligence_signals
ENABLE ROW LEVEL SECURITY;

-- 3️⃣ Remove old policies
DROP POLICY IF EXISTS demand_signal_buyer_policy ON public.demand_intelligence_signals;
DROP POLICY IF EXISTS demand_signal_admin_policy ON public.demand_intelligence_signals;

-- 4️⃣ Buyer isolation
CREATE POLICY demand_signal_buyer_policy
ON public.demand_intelligence_signals
FOR SELECT
USING (buyer_id = auth.uid());

-- 5️⃣ Admin override (using has_role for consistency)
CREATE POLICY demand_signal_admin_policy
ON public.demand_intelligence_signals
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6️⃣ Reload schema cache
NOTIFY pgrst, 'reload schema';
