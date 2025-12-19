-- Create trigger to automatically grant early adopter status to new suppliers and logistics partners
DROP TRIGGER IF EXISTS on_user_role_created ON public.user_roles;

CREATE TRIGGER on_user_role_created
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_early_adopter_subscription();