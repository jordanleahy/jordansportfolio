-- Fix security vulnerability: Restrict home_health table access to authenticated users only
-- Currently the table allows public read access which exposes sensitive healthcare data

-- Drop the existing public policy
DROP POLICY IF EXISTS "Home health data is publicly viewable" ON public.home_health;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view home health data" 
ON public.home_health 
FOR SELECT 
TO authenticated 
USING (true);

-- Optional: Create admin-only policy for data management (uncomment if needed)
-- CREATE POLICY "Admins can manage home health data"
-- ON public.home_health
-- FOR ALL
-- TO authenticated
-- USING (has_role(auth.uid(), 'admin'::app_role))
-- WITH CHECK (has_role(auth.uid(), 'admin'::app_role));