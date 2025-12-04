-- Fix 1: Restrict profiles table SELECT policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a function to check if users have a business relationship
CREATE OR REPLACE FUNCTION public.has_business_relationship(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Buyer viewing supplier who bid on their requirement
    SELECT 1 FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE r.buyer_id = _viewer_id AND b.supplier_id = _profile_id
    
    UNION
    
    -- Supplier viewing buyer whose requirement they bid on
    SELECT 1 FROM bids b
    JOIN requirements r ON r.id = b.requirement_id
    WHERE b.supplier_id = _viewer_id AND r.buyer_id = _profile_id
  )
$$;

-- Create restricted SELECT policy for profiles
CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_business_relationship(auth.uid(), id)
);

-- Fix 2: Restrict transactions INSERT policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;

-- Create trigger function to automatically create transactions when bids are accepted
CREATE OR REPLACE FUNCTION public.handle_bid_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requirement requirements%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get the requirement details
    SELECT * INTO v_requirement FROM requirements WHERE id = NEW.requirement_id;
    
    -- Create the transaction record
    INSERT INTO transactions (buyer_id, supplier_id, bid_id, amount, service_fee)
    VALUES (
      v_requirement.buyer_id,
      NEW.supplier_id,
      NEW.id,
      NEW.bid_amount,
      NEW.service_fee
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for bid acceptance
DROP TRIGGER IF EXISTS on_bid_accepted ON public.bids;
CREATE TRIGGER on_bid_accepted
  AFTER UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bid_acceptance();