-- Add additional RLS policy to ensure vendor_jobs operations require admin role for the cover letter generation feature
CREATE POLICY "Admin users can manage all vendor jobs for cover letter generation"
ON public.vendor_jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Update the existing policy to be more specific
DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.vendor_jobs;

CREATE POLICY "Admins can manage all vendor jobs"
ON public.vendor_jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);