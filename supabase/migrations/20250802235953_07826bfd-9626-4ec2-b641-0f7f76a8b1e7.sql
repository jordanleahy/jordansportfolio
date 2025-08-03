-- Add missing columns to openai_agents table for advanced model parameters
ALTER TABLE public.openai_agents 
ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS top_p DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS frequency_penalty DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS presence_penalty DECIMAL(3,2) DEFAULT NULL;