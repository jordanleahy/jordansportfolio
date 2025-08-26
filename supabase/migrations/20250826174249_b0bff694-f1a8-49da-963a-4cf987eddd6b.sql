-- Add service role policy for system_prompts table
CREATE POLICY "Service role can manage all system prompts" 
ON public.system_prompts 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');