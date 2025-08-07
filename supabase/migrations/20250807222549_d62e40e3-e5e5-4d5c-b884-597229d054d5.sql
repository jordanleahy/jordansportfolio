-- Fix RLS policy for system_prompts table to allow users to view their own prompts
DROP POLICY IF EXISTS "Users can view system prompts for accessible agents" ON public.system_prompts;

CREATE POLICY "Users can view their own system prompts" 
ON public.system_prompts 
FOR SELECT 
USING (auth.uid() = user_id);