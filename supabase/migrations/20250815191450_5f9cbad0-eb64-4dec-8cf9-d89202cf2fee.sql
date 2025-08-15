-- Create a more efficient role checking function that returns all roles at once
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id;
$$;