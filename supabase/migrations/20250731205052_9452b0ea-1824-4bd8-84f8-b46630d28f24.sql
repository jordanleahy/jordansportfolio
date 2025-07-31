-- Create agent_relationships table for dependency management
CREATE TABLE IF NOT EXISTS public.agent_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_agent_id UUID NOT NULL,
  target_agent_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'dependency',
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_source_agent FOREIGN KEY (source_agent_id) REFERENCES public.openai_agents(id) ON DELETE CASCADE,
  CONSTRAINT fk_target_agent FOREIGN KEY (target_agent_id) REFERENCES public.openai_agents(id) ON DELETE CASCADE,
  
  -- Prevent self-reference
  CONSTRAINT no_self_reference CHECK (source_agent_id != target_agent_id),
  
  -- Unique constraint to prevent duplicate relationships
  CONSTRAINT unique_agent_relationship UNIQUE (source_agent_id, target_agent_id, relationship_type)
);

-- Enable RLS on agent_relationships table
ALTER TABLE public.agent_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_relationships
CREATE POLICY "Users can view relationships for their agents" 
ON public.agent_relationships 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE id = agent_relationships.source_agent_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE id = agent_relationships.target_agent_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create relationships for their agents" 
ON public.agent_relationships 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE id = source_agent_id 
    AND user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE id = target_agent_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update relationships for their agents" 
ON public.agent_relationships 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE id = agent_relationships.source_agent_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete relationships for their agents" 
ON public.agent_relationships 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.openai_agents 
    WHERE id = agent_relationships.source_agent_id 
    AND user_id = auth.uid()
  )
);

-- Create function to detect cycles in agent dependencies
CREATE OR REPLACE FUNCTION public.detect_dependency_cycle(
  p_source_agent_id UUID,
  p_target_agent_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Use recursive CTE to check for cycles
  WITH RECURSIVE dependency_path AS (
    -- Base case: direct relationship
    SELECT 
      source_agent_id,
      target_agent_id,
      1 as depth,
      ARRAY[source_agent_id, target_agent_id] as path
    FROM public.agent_relationships
    WHERE source_agent_id = p_target_agent_id
    
    UNION ALL
    
    -- Recursive case: follow dependency chain
    SELECT 
      ar.source_agent_id,
      ar.target_agent_id,
      dp.depth + 1,
      dp.path || ar.target_agent_id
    FROM public.agent_relationships ar
    JOIN dependency_path dp ON ar.source_agent_id = dp.target_agent_id
    WHERE dp.depth < 10 -- Prevent infinite recursion
    AND NOT ar.target_agent_id = ANY(dp.path) -- Prevent cycles in path
  )
  SELECT COUNT(*) > 0
  FROM dependency_path
  WHERE target_agent_id = p_source_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get agent dependencies with depth
CREATE OR REPLACE FUNCTION public.get_agent_dependencies(p_agent_id UUID)
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  relationship_type TEXT,
  depth INTEGER,
  is_required BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dependency_tree AS (
    -- Base case: direct dependencies
    SELECT 
      ar.target_agent_id as agent_id,
      oa.name as agent_name,
      ar.relationship_type,
      1 as depth,
      ar.is_required
    FROM public.agent_relationships ar
    JOIN public.openai_agents oa ON ar.target_agent_id = oa.id
    WHERE ar.source_agent_id = p_agent_id
    
    UNION ALL
    
    -- Recursive case: dependencies of dependencies
    SELECT 
      ar.target_agent_id,
      oa.name,
      ar.relationship_type,
      dt.depth + 1,
      ar.is_required
    FROM public.agent_relationships ar
    JOIN public.openai_agents oa ON ar.target_agent_id = oa.id
    JOIN dependency_tree dt ON ar.source_agent_id = dt.agent_id
    WHERE dt.depth < 5 -- Limit recursion depth
  )
  SELECT DISTINCT * FROM dependency_tree ORDER BY depth, agent_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
CREATE TRIGGER update_agent_relationships_updated_at
  BEFORE UPDATE ON public.agent_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert example relationship: Blog Visual Prompt Generator depends on System Prompt Generator
DO $$
DECLARE
  system_prompt_agent_id UUID;
  visual_prompt_agent_id UUID;
BEGIN
  -- Get System Prompt Generator agent ID
  SELECT id INTO system_prompt_agent_id
  FROM public.openai_agents 
  WHERE name = 'System Prompt Generator'
  LIMIT 1;
  
  -- Get Blog Visual Prompt Generator agent ID  
  SELECT id INTO visual_prompt_agent_id
  FROM public.openai_agents 
  WHERE name = 'Blog Visual Prompt Generator'
  LIMIT 1;
  
  -- Create relationship if both agents exist
  IF system_prompt_agent_id IS NOT NULL AND visual_prompt_agent_id IS NOT NULL THEN
    INSERT INTO public.agent_relationships (
      source_agent_id,
      target_agent_id,
      relationship_type,
      description,
      is_required
    ) VALUES (
      visual_prompt_agent_id,
      system_prompt_agent_id,
      'dependency',
      'Blog Visual Prompt Generator requires System Prompt Generator to create contextual system prompts before generating visual content prompts',
      true
    ) ON CONFLICT (source_agent_id, target_agent_id, relationship_type) DO NOTHING;
  END IF;
END $$;