-- Add RLS policies for system_prompts table to allow service role access
-- Enable RLS on system_prompts table
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- Service role can manage all system prompts
CREATE POLICY "Service role can manage all system prompts" 
ON public.system_prompts 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Users can view their own system prompts
CREATE POLICY "Users can view their own system prompts" 
ON public.system_prompts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own system prompts
CREATE POLICY "Users can create their own system prompts" 
ON public.system_prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own system prompts
CREATE POLICY "Users can update their own system prompts" 
ON public.system_prompts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own system prompts
CREATE POLICY "Users can delete their own system prompts" 
ON public.system_prompts 
FOR DELETE 
USING (auth.uid() = user_id);