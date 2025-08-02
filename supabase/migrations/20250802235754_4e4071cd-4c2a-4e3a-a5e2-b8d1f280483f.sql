-- Create the system_prompts table
CREATE TABLE public.system_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.openai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view system prompts for their own agents"
ON public.system_prompts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE openai_agents.id = system_prompts.agent_id 
    AND openai_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create system prompts for their own agents"
ON public.system_prompts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE openai_agents.id = system_prompts.agent_id 
    AND openai_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update system prompts for their own agents"
ON public.system_prompts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE openai_agents.id = system_prompts.agent_id 
    AND openai_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete system prompts for their own agents"
ON public.system_prompts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE openai_agents.id = system_prompts.agent_id 
    AND openai_agents.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_system_prompts_agent_id ON public.system_prompts(agent_id);
CREATE INDEX idx_system_prompts_user_id ON public.system_prompts(user_id);
CREATE INDEX idx_system_prompts_category ON public.system_prompts(category);

-- Create trigger for updated_at
CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON public.system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing system prompts from agents' JSON field to the new table
INSERT INTO public.system_prompts (agent_id, user_id, category, prompt_text)
SELECT 
  oa.id as agent_id,
  oa.user_id,
  (jsonb_array_elements(oa.system_prompts)->>'category')::text as category,
  (jsonb_array_elements(oa.system_prompts)->>'prompt')::text as prompt_text
FROM public.openai_agents oa
WHERE oa.system_prompts IS NOT NULL 
  AND jsonb_array_length(oa.system_prompts) > 0;