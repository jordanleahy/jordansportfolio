-- Create agent constants table and function for centralized agent name management
-- This addresses the hardcoded 'Visual Prompt Generator' name issue

-- Create a constants table for agent names
CREATE TABLE IF NOT EXISTS public.agent_constants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constant_name TEXT NOT NULL UNIQUE,
  constant_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on agent_constants
ALTER TABLE public.agent_constants ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_constants (read-only for all authenticated users)
CREATE POLICY "Anyone can read agent constants" 
ON public.agent_constants 
FOR SELECT 
USING (true);

-- Insert the centralized agent name constants
INSERT INTO public.agent_constants (constant_name, constant_value, description) VALUES
('VISUAL_PROMPT_GENERATOR', 'Visual Prompt Generator', 'Main visual prompt generator agent name'),
('BLOG_VISUAL_PROMPT_GENERATOR', 'Blog Visual Prompt Generator', 'Legacy blog visual prompt generator name'),
('SYSTEM_PROMPT_GENERATOR', 'System Prompt Generator', 'System prompt generator agent name'),
('BLOG_CONTENT_GENERATOR', 'Blog Content Generator', 'Blog content generator agent name'),
('COVER_LETTER_GENERATOR', 'Cover Letter Generator', 'Cover letter generator agent name'),
('CALENDAR_THEME_JSON_PROCESSOR', 'Calendar Theme JSON Processor', 'Calendar theme processor agent name')
ON CONFLICT (constant_name) DO UPDATE SET 
  constant_value = EXCLUDED.constant_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create a helper function to get agent names
CREATE OR REPLACE FUNCTION public.get_agent_name(constant_name TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT constant_value 
  FROM public.agent_constants 
  WHERE agent_constants.constant_name = get_agent_name.constant_name
  LIMIT 1;
$$;

-- Update the auto_add_category_to_blog_agent function to use the lookup
CREATE OR REPLACE FUNCTION public.auto_add_category_to_blog_agent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  agent_id_var uuid;
  current_prompts jsonb;
  current_categories text[];
  new_prompt jsonb;
  updated_prompts jsonb;
  updated_categories text[];
  
  -- Constants
  VISUAL_PROMPT_GENERATOR_NAME CONSTANT text := get_agent_name('VISUAL_PROMPT_GENERATOR');
  SIMPLE_FALLBACK_PROMPT CONSTANT text := 'You are an expert at creating detailed, professional image generation prompts for %s-themed AI image generators. Focus on creating clear, specific prompts that generate high-quality, professional visuals suitable for %s professionals. Use vector illustration style with clean, modern design and professional color palette. Always specify the aspect ratio in your prompt.';
BEGIN
  -- Input validation and early return conditions
  IF NEW.category IS NULL OR NEW.category = '' THEN
    RETURN NEW;
  END IF;

  -- Get the Visual Prompt Generator agent using centralized name lookup
  SELECT id, system_prompts, supported_categories 
  INTO agent_id_var, current_prompts, current_categories
  FROM openai_agents 
  WHERE name = VISUAL_PROMPT_GENERATOR_NAME 
  AND user_id = NEW.user_id
  LIMIT 1;

  -- Early return if agent not found or category already exists
  IF agent_id_var IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF current_categories IS NOT NULL AND NEW.category = ANY(current_categories) THEN
    RETURN NEW;
  END IF;

  -- Just use simple fallback and add to supported categories
  -- User can manually generate richer prompts using the UI
  new_prompt := jsonb_build_object(
    'category', NEW.category,
    'prompt', format(SIMPLE_FALLBACK_PROMPT, NEW.category, NEW.category)
  );

  updated_prompts := COALESCE(current_prompts, '[]'::jsonb) || jsonb_build_array(new_prompt);
  updated_categories := COALESCE(current_categories, '{}'::text[]) || NEW.category;

  -- Single atomic update
  UPDATE openai_agents 
  SET 
    system_prompts = updated_prompts,
    supported_categories = updated_categories,
    updated_at = now()
  WHERE id = agent_id_var;

  RETURN NEW;
END;
$function$;

-- Create trigger for automatic timestamp updates on agent_constants
CREATE OR REPLACE FUNCTION public.update_agent_constants_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_agent_constants_updated_at
  BEFORE UPDATE ON public.agent_constants
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_constants_updated_at();