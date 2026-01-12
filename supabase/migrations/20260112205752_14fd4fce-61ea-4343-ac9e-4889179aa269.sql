-- 1️⃣ Enforce justification for PARTIAL awards at DB level
ALTER TABLE public.bids
ADD CONSTRAINT partial_award_requires_justification
CHECK (
  award_type <> 'PARTIAL'
  OR award_justification IS NOT NULL
);

-- 2️⃣ Prevent multiple awards per requirement (only one awarded bid allowed)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_awarded_bid_per_requirement
ON public.bids (requirement_id)
WHERE award_type IS NOT NULL;