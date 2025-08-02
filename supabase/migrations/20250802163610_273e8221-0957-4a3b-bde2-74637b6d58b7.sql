-- Create enhanced system prompts table
CREATE TABLE public.system_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.openai_agents(id) ON DELETE SET NULL,
  agent_name text,
  agent_purpose text,
  agent_owner text,
  name text NOT NULL,
  category text NOT NULL,
  prompt_text text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_template boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own system prompts"
ON public.system_prompts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own system prompts"
ON public.system_prompts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own system prompts"
ON public.system_prompts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own system prompts"
ON public.system_prompts
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_system_prompts_user_id ON public.system_prompts(user_id);
CREATE INDEX idx_system_prompts_agent_id ON public.system_prompts(agent_id);
CREATE INDEX idx_system_prompts_category ON public.system_prompts(category);
CREATE INDEX idx_system_prompts_active ON public.system_prompts(is_active);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_system_prompts_updated_at
BEFORE UPDATE ON public.system_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to migrate existing agent system prompts
CREATE OR REPLACE FUNCTION public.migrate_agent_system_prompts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_record RECORD;
  prompt_record jsonb;
  inserted_count integer := 0;
BEGIN
  -- Loop through all agents with system prompts
  FOR agent_record IN 
    SELECT id, user_id, name, purpose, owner, system_prompts
    FROM public.openai_agents
    WHERE system_prompts IS NOT NULL AND jsonb_array_length(system_prompts) > 0
  LOOP
    -- Loop through each system prompt in the agent
    FOR prompt_record IN 
      SELECT * FROM jsonb_array_elements(agent_record.system_prompts)
    LOOP
      -- Insert the prompt into the system_prompts table
      INSERT INTO public.system_prompts (
        user_id,
        agent_id,
        agent_name,
        agent_purpose,
        agent_owner,
        name,
        category,
        prompt_text,
        description
      ) VALUES (
        agent_record.user_id,
        agent_record.id,
        agent_record.name,
        agent_record.purpose,
        agent_record.owner,
        COALESCE(prompt_record->>'name', agent_record.name || ' - ' || (prompt_record->>'category')),
        prompt_record->>'category',
        prompt_record->>'prompt',
        'Migrated from agent: ' || agent_record.name
      )
      ON CONFLICT DO NOTHING; -- Prevent duplicates if run multiple times
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;

-- Create function to update prompt usage statistics
CREATE OR REPLACE FUNCTION public.update_prompt_usage(p_prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.system_prompts
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = p_prompt_id;
END;
$$;

-- Create function to get prompt statistics
CREATE OR REPLACE FUNCTION public.get_prompt_stats(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  total_prompts bigint,
  active_prompts bigint,
  template_prompts bigint,
  categories_count bigint,
  total_usage bigint,
  avg_usage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_prompts,
    COUNT(*) FILTER (WHERE is_active = true) as active_prompts,
    COUNT(*) FILTER (WHERE is_template = true) as template_prompts,
    COUNT(DISTINCT category) as categories_count,
    SUM(usage_count) as total_usage,
    AVG(usage_count) as avg_usage
  FROM public.system_prompts
  WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$;

-- Create function to find prompts by category and agent
CREATE OR REPLACE FUNCTION public.find_prompts_by_category(
  p_category text,
  p_user_id uuid DEFAULT NULL,
  p_agent_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  prompt_text text,
  agent_name text,
  usage_count integer,
  last_used_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.prompt_text,
    sp.agent_name,
    sp.usage_count,
    sp.last_used_at
  FROM public.system_prompts sp
  WHERE sp.category = p_category
    AND sp.is_active = true
    AND (p_user_id IS NULL OR sp.user_id = p_user_id)
    AND (p_agent_id IS NULL OR sp.agent_id = p_agent_id)
  ORDER BY sp.usage_count DESC, sp.updated_at DESC;
END;
$$;