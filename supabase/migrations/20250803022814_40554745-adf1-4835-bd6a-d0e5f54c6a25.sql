-- Remove problematic policies that could cause recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create a bootstrap admin function that doesn't rely on RLS
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Check if this user has admin role directly without going through RLS
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- Create safer admin policies for user_roles table
CREATE POLICY "Bootstrap admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_bootstrap_admin(auth.uid()));

CREATE POLICY "Bootstrap admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_bootstrap_admin(auth.uid()));

-- Also add a trigger to automatically assign 'user' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  RETURN NEW;
END;
$$;

-- Create trigger for new user role assignment (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();