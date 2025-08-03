-- Add admin policies to openai_agents table to allow admins access to all agents

-- Admin can view all agents
CREATE POLICY "Admins can view all agents" ON public.openai_agents
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update all agents  
CREATE POLICY "Admins can update all agents" ON public.openai_agents
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete all agents
CREATE POLICY "Admins can delete all agents" ON public.openai_agents  
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can create agents for any user
CREATE POLICY "Admins can create agents for any user" ON public.openai_agents
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));