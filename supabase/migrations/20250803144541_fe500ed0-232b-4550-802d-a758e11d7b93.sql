-- Update system_prompts policies to allow users to view prompts for agents they can access

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view system prompts for their own agents" ON public.system_prompts;

-- Add new policy that allows users to view system prompts for any agent they can access
-- Since we now allow all authenticated users to view all agents, they should also be able to view the system prompts
CREATE POLICY "Users can view system prompts for accessible agents" ON public.system_prompts
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Keep the other policies restrictive for create/update/delete
-- Users can still only modify system prompts for their own agents