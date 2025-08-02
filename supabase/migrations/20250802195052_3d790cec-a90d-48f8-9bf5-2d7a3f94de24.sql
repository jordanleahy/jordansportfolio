-- Add advanced model parameters to openai_agents table
ALTER TABLE public.openai_agents 
ADD COLUMN IF NOT EXISTS temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens >= 1 AND max_tokens <= 4000),
ADD COLUMN IF NOT EXISTS top_p NUMERIC(3,2) DEFAULT 1.0 CHECK (top_p >= 0 AND top_p <= 1),
ADD COLUMN IF NOT EXISTS frequency_penalty NUMERIC(3,2) DEFAULT 0.0 CHECK (frequency_penalty >= -2 AND frequency_penalty <= 2),
ADD COLUMN IF NOT EXISTS presence_penalty NUMERIC(3,2) DEFAULT 0.0 CHECK (presence_penalty >= -2 AND presence_penalty <= 2);

-- Add comment explaining the new columns
COMMENT ON COLUMN public.openai_agents.temperature IS 'Controls randomness in responses (0-2). Lower values = more focused.';
COMMENT ON COLUMN public.openai_agents.max_tokens IS 'Maximum length of response (1-4000 tokens).';
COMMENT ON COLUMN public.openai_agents.top_p IS 'Nucleus sampling parameter (0-1).';
COMMENT ON COLUMN public.openai_agents.frequency_penalty IS 'Penalizes repeated tokens (-2 to 2).';
COMMENT ON COLUMN public.openai_agents.presence_penalty IS 'Penalizes presence of tokens (-2 to 2).';