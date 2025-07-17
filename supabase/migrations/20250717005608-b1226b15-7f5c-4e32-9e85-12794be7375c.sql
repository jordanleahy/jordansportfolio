-- Update RLS policies for jobs table to allow service role access
-- First drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can delete jobs" ON public.jobs;

-- Create new policies that allow service role access
CREATE POLICY "Service role and authenticated users can insert jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Service role and authenticated users can view jobs" 
ON public.jobs 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Service role and authenticated users can update jobs" 
ON public.jobs 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL OR 
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Service role and authenticated users can delete jobs" 
ON public.jobs 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL OR 
  auth.jwt() ->> 'role' = 'service_role'
);