-- Allow all authenticated users to view all agents (read-only access to system agents)
CREATE POLICY "Authenticated users can view all agents" ON public.openai_agents
FOR SELECT 
USING (auth.uid() IS NOT NULL);