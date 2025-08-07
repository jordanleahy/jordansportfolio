-- Fix the system_prompts column issue in openai_agents table
-- The edge function is failing because it expects a system_prompts column

-- Check if the openai_agents table is missing the system_prompts column
-- and add it if it doesn't exist

-- First, let's ensure the openai_agents table has all necessary columns
ALTER TABLE public.openai_agents 
ADD COLUMN IF NOT EXISTS system_prompts JSONB DEFAULT '[]'::jsonb;

-- Update the column comment for clarity
COMMENT ON COLUMN public.openai_agents.system_prompts IS 'Array of system prompts for different categories supported by this agent';

-- Create an index for better performance when querying system prompts
CREATE INDEX IF NOT EXISTS idx_openai_agents_system_prompts 
ON public.openai_agents USING GIN (system_prompts);

-- Ensure the system_prompts table has proper indexes as well
CREATE INDEX IF NOT EXISTS idx_system_prompts_agent_category 
ON public.system_prompts (agent_id, category);

CREATE INDEX IF NOT EXISTS idx_system_prompts_user_active 
ON public.system_prompts (user_id, is_active) WHERE is_active = true;