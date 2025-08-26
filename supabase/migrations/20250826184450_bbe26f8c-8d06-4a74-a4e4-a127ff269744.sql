-- Fix the System Prompt Generator agent OpenAI parameters and make it accessible to all users
-- without changing ownership to avoid foreign key issues

-- Add max_completion_tokens column if it doesn't exist
ALTER TABLE public.openai_agents 
ADD COLUMN IF NOT EXISTS max_completion_tokens integer;

-- Update the existing System Prompt Generator agent with correct OpenAI parameters
UPDATE public.openai_agents 
SET 
    model_version = 'gpt-5-mini',
    temperature = NULL,  -- Remove temperature for newer models
    max_completion_tokens = COALESCE(max_tokens, 1000),  -- Convert max_tokens to max_completion_tokens
    max_tokens = NULL,   -- Remove old max_tokens
    frequency_penalty = NULL,  -- Clean up unused parameters
    presence_penalty = NULL    -- Clean up unused parameters
WHERE id = '18939217-944d-4497-905a-81f5332ee08b'
AND name = 'System Prompt Generator';

-- Update RLS policies for openai_agents table to allow access to system agents
DROP POLICY IF EXISTS "Users can view their own agents" ON public.openai_agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON public.openai_agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON public.openai_agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON public.openai_agents;

-- Create new RLS policies that allow access to the System Prompt Generator for all users
CREATE POLICY "Users can view their own agents and System Prompt Generator" 
ON public.openai_agents 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR name = 'System Prompt Generator'
);

CREATE POLICY "Users can create their own agents" 
ON public.openai_agents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" 
ON public.openai_agents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" 
ON public.openai_agents 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all agents" 
ON public.openai_agents 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Update RLS policies for system_prompts table to allow access to System Prompt Generator prompts
DROP POLICY IF EXISTS "Users can view their own system prompts" ON public.system_prompts;
DROP POLICY IF EXISTS "Users can create their own system prompts" ON public.system_prompts;
DROP POLICY IF EXISTS "Users can update their own system prompts" ON public.system_prompts;
DROP POLICY IF EXISTS "Users can delete their own system prompts" ON public.system_prompts;

-- Create new RLS policies for system_prompts that allow access to System Prompt Generator prompts
CREATE POLICY "Users can view their own prompts and system prompts" 
ON public.system_prompts 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR agent_name = 'System Prompt Generator'
);

CREATE POLICY "Users can create their own prompts" 
ON public.system_prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" 
ON public.system_prompts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" 
ON public.system_prompts 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all system prompts" 
ON public.system_prompts 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Update all other agents that have max_tokens to use max_completion_tokens instead
UPDATE public.openai_agents 
SET 
    max_completion_tokens = COALESCE(max_tokens, 1000),
    max_tokens = NULL
WHERE max_tokens IS NOT NULL 
AND id != '18939217-944d-4497-905a-81f5332ee08b';

-- Create agent constant for the System Prompt Generator ID for easy reference
INSERT INTO public.agent_constants (constant_name, constant_value, description) 
VALUES (
    'SYSTEM_PROMPT_GENERATOR_ID', 
    '18939217-944d-4497-905a-81f5332ee08b', 
    'ID of the System Prompt Generator agent accessible to all users'
) ON CONFLICT (constant_name) DO UPDATE SET constant_value = EXCLUDED.constant_value;