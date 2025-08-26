-- Fix auto_add_category_to_blog_agent trigger function to work with separated system_prompts table
-- This resolves the "column 'system_prompts' does not exist" error that's preventing post creation

CREATE OR REPLACE FUNCTION public.auto_add_category_to_blog_agent() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $function$
DECLARE
  agent_id_var uuid;
  current_categories text[];
  new_prompt_text text;
  system_prompt_id_var uuid;
  
  -- Constants - Using centralized lookup instead of hardcoded values
  VISUAL_PROMPT_GENERATOR_NAME CONSTANT text := get_agent_name('VISUAL_PROMPT_GENERATOR');
  THEME_FALLBACK_PROMPT CONSTANT text := 'You are an expert at creating detailed, professional image generation prompts for %s-themed AI image generators with %s category context. Focus on creating clear, specific prompts that generate high-quality, professional visuals suitable for %s professionals. Use vector illustration style with clean, modern design and professional color palette. Always specify the aspect ratio in your prompt.';
BEGIN
  -- Input validation and early return conditions
  IF NEW.category IS NULL OR NEW.category = '' THEN
    RETURN NEW;
  END IF;

  -- Get the Visual Prompt Generator agent using centralized name lookup
  SELECT id, supported_categories 
  INTO agent_id_var, current_categories
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

  -- Create category-aware prompt text
  new_prompt_text := format(THEME_FALLBACK_PROMPT, NEW.category, NEW.category, NEW.category);

  -- Insert new system prompt for this category
  INSERT INTO system_prompts (
    agent_id,
    user_id,
    category,
    prompt_text,
    agent_name,
    agent_purpose,
    agent_owner,
    name,
    description
  ) VALUES (
    agent_id_var,
    NEW.user_id,
    NEW.category,
    new_prompt_text,
    VISUAL_PROMPT_GENERATOR_NAME,
    'Generate visual prompts for ' || NEW.category || ' category',
    'Content Creation Team',
    NEW.category || ' Visual Prompt',
    'Auto-generated visual prompt for ' || NEW.category || ' category'
  ) RETURNING id INTO system_prompt_id_var;

  -- Update the agent with new supported category
  UPDATE openai_agents 
  SET 
    supported_categories = COALESCE(current_categories, ARRAY[]::text[]) || ARRAY[NEW.category],
    updated_at = now()
  WHERE id = agent_id_var;

  RETURN NEW;
END;
$function$;