-- Add RLS policy for admins to update bids
CREATE POLICY "Admins can update all bids" 
ON public.bids 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update logistics bids
CREATE POLICY "Admins can update all logistics bids" 
ON public.logistics_bids 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));