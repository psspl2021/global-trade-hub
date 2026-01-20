-- Fix search_path on newly created functions for security
ALTER FUNCTION public.get_effective_requirement_state(public.requirements) SET search_path = public;
ALTER FUNCTION public.prevent_award_if_buyer_closed() SET search_path = public;
ALTER FUNCTION public.log_requirement_state_change() SET search_path = public;