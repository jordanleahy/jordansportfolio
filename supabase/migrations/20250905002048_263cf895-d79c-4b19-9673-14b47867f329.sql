-- Update all references to the renamed edge function from invoke-system-prompt-agent to create-theme-system-prompt
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
  edge_function_response jsonb;
  generated_prompt_text text;
  
  -- Constants - Updated to use the new function name
  VISUAL_PROMPT_GENERATOR_NAME CONSTANT text := 'Visual Prompt Generator';
  SUPABASE_URL CONSTANT text := 'https://wgwmzfbnkovumqcvsxgd.supabase.co';
  EDGE_FUNCTION_URL CONSTANT text := '/functions/v1/create-theme-system-prompt';
  FALLBACK_PROMPT_TEMPLATE CONSTANT text := 'You are an expert at creating detailed, professional image generation prompts for %s-themed AI image generators. Focus on creating clear, specific prompts that generate high-quality, professional visuals suitable for %s professionals. Use vector illustration style with clean, modern design and professional color palette. Always specify the aspect ratio in your prompt.';
BEGIN
  -- Input validation and early return conditions
  IF NEW.category IS NULL OR NEW.category = '' THEN
    RETURN NEW;
  END IF;

  -- Get the Visual Prompt Generator agent
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

  -- For now, just use the fallback template since the HTTP call is complex in triggers
  -- TODO: Consider moving this to a background job or client-side call
  generated_prompt_text := format(FALLBACK_PROMPT_TEMPLATE, NEW.category, NEW.category);
  
  RAISE WARNING 'Using fallback prompt for category: %. Consider calling edge function manually for richer prompts.', NEW.category;

  -- Build and update prompts and categories
  new_prompt := jsonb_build_object(
    'category', NEW.category,
    'prompt', generated_prompt_text
  );

  updated_prompts := COALESCE(current_prompts, '[]'::jsonb) || jsonb_build_array(new_prompt);
  updated_categories := COALESCE(current_categories, '{}'::text[]) || NEW.category;

  -- Single atomic update
  UPDATE openai_agents 
  SET 
    system_prompts = updated_prompts,
    supported_categories = updated_categories,
    last_run = now(),
    updated_at = now()
  WHERE id = agent_id_var;

  RETURN NEW;
END;
$function$;