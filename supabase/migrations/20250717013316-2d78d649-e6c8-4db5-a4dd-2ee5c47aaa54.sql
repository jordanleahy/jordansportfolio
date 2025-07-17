-- Fix RLS policies for jobs table to properly support service role access
-- Drop existing policies
DROP POLICY IF EXISTS "Service role and authenticated users can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Service role and authenticated users can view jobs" ON public.jobs;
DROP POLICY IF EXISTS "Service role and authenticated users can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Service role and authenticated users can delete jobs" ON public.jobs;

-- Create new policies that allow service role to bypass RLS entirely
-- For Edge Functions, we need to trust the service role completely
CREATE POLICY "Allow all operations for service role and authenticated users" 
ON public.jobs 
FOR ALL 
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- Additional policy for anon users to view jobs (read-only access)
CREATE POLICY "Public can view active jobs" 
ON public.jobs 
FOR SELECT 
TO anon
USING (is_active = true);