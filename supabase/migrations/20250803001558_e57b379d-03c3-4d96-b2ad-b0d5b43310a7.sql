-- Add missing columns to system_prompts table that the edge function expects
ALTER TABLE public.system_prompts 
ADD COLUMN IF NOT EXISTS agent_name TEXT,
ADD COLUMN IF NOT EXISTS agent_purpose TEXT,
ADD COLUMN IF NOT EXISTS agent_owner TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;