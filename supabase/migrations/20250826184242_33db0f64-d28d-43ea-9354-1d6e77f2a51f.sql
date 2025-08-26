-- Step 1: Create System-Wide Agent Infrastructure
-- Define a dedicated system user ID for system agents
DO $$ 
DECLARE
    system_user_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Step 2: Migrate Existing System Prompt Generator to be system-owned
    -- Update the existing System Prompt Generator agent
    UPDATE public.openai_agents 
    SET 
        user_id = system_user_id,
        model_version = 'gpt-5-mini',
        temperature = NULL,  -- Remove temperature for newer models
        max_tokens = NULL,   -- Remove old max_tokens
        frequency_penalty = NULL,  -- Clean up unused parameters
        presence_penalty = NULL    -- Clean up unused parameters
    WHERE id = '18939217-944d-4497-905a-81f5332ee08b'
    AND name = 'System Prompt Generator';

    -- Update all system prompts associated with the System Prompt Generator to be system-owned
    UPDATE public.system_prompts 
    SET user_id = system_user_id
    WHERE agent_id = '18939217-944d-4497-905a-81f5332ee08b';
END $$;

-- Step 1 (continued): Update RLS policies for openai_agents table
DROP POLICY IF EXISTS "Users can view their own agents" ON public.openai_agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON public.openai_agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON public.openai_agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON public.openai_agents;

-- Create new RLS policies that allow access to system agents
CREATE POLICY "Users can view their own agents and system agents" 
ON public.openai_agents 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Users can create their own agents" 
ON public.openai_agents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" 
ON public.openai_agents 
FOR UPDATE 
USING (
    auth.uid() = user_id 
    AND user_id != '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Users can delete their own agents" 
ON public.openai_agents 
FOR DELETE 
USING (
    auth.uid() = user_id 
    AND user_id != '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Service role can manage all agents" 
ON public.openai_agents 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Update RLS policies for system_prompts table
DROP POLICY IF EXISTS "Users can view their own system prompts" ON public.system_prompts;
DROP POLICY IF EXISTS "Users can create their own system prompts" ON public.system_prompts;
DROP POLICY IF EXISTS "Users can update their own system prompts" ON public.system_prompts;
DROP POLICY IF EXISTS "Users can delete their own system prompts" ON public.system_prompts;

-- Create new RLS policies for system_prompts that allow access to system prompts
CREATE POLICY "Users can view their own prompts and system prompts" 
ON public.system_prompts 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Users can create their own prompts" 
ON public.system_prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" 
ON public.system_prompts 
FOR UPDATE 
USING (
    auth.uid() = user_id 
    AND user_id != '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Users can delete their own prompts" 
ON public.system_prompts 
FOR DELETE 
USING (
    auth.uid() = user_id 
    AND user_id != '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Service role can manage all system prompts" 
ON public.system_prompts 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Add new column for max_completion_tokens to openai_agents table
ALTER TABLE public.openai_agents 
ADD COLUMN IF NOT EXISTS max_completion_tokens integer;

-- Update existing agents that have max_tokens to use max_completion_tokens instead
UPDATE public.openai_agents 
SET 
    max_completion_tokens = max_tokens,
    max_tokens = NULL
WHERE max_tokens IS NOT NULL;

-- Create agent constant for system user ID for easy reference
INSERT INTO public.agent_constants (constant_name, constant_value, description) 
VALUES (
    'SYSTEM_USER_ID', 
    '00000000-0000-0000-0000-000000000000', 
    'Dedicated user ID for system-wide agents'
) ON CONFLICT (constant_name) DO UPDATE SET constant_value = EXCLUDED.constant_value;