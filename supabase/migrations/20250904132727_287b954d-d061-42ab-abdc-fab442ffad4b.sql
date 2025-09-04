-- Fix security vulnerability: Restrict home_health table to admin access only
-- Analysis shows this table is not used by the application, so we can apply strictest access control

-- Drop the current policy that allows any authenticated user access
DROP POLICY IF EXISTS "Authenticated users can view home health data" ON public.home_health;

-- Create admin-only policy for viewing sensitive healthcare data
CREATE POLICY "Admin users only can view home health data" 
ON public.home_health 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Create admin-only policy for data management (insert, update, delete)
CREATE POLICY "Admin users only can manage home health data"
ON public.home_health
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);