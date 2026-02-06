-- Fix search_path for the new function
CREATE OR REPLACE FUNCTION public.calculate_purchaser_efficiency_score(
  p_savings DECIMAL,
  p_turnaround DECIMAL,
  p_variance DECIMAL,
  p_compliance DECIMAL,
  p_audit DECIMAL
) RETURNS DECIMAL 
LANGUAGE plpgsql 
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  savings_weight DECIMAL := 0.35;
  turnaround_weight DECIMAL := 0.20;
  variance_weight DECIMAL := 0.15;
  compliance_weight DECIMAL := 0.15;
  audit_weight DECIMAL := 0.15;
  normalized_turnaround DECIMAL;
BEGIN
  -- Normalize turnaround (lower is better, max 100 for < 24h)
  normalized_turnaround := GREATEST(0, 100 - (p_turnaround / 2.4));
  
  RETURN (
    (LEAST(p_savings / 10000, 100) * savings_weight) +
    (normalized_turnaround * turnaround_weight) +
    (p_variance * variance_weight) +
    (p_compliance * compliance_weight) +
    (p_audit * audit_weight)
  );
END;
$$;