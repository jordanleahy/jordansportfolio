-- Fix system prompts RLS policies to allow users to save their own system prompts
-- regardless of agent ownership

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update system prompts for their own agents" ON public.system_prompts;
DROP POLICY IF EXISTS "Users can delete system prompts for their own agents" ON public.system_prompts;
DROP POLICY IF EXISTS "Users can create system prompts for their own agents" ON public.system_prompts;

-- Create new policies that allow users to manage their own system prompts
CREATE POLICY "Users can update their own system prompts" 
ON public.system_prompts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own system prompts" 
ON public.system_prompts 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own system prompts" 
ON public.system_prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also allow admins to manage all system prompts
CREATE POLICY "Admins can manage all system prompts" 
ON public.system_prompts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));