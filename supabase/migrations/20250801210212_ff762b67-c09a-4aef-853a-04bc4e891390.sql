-- Final consolidated migration: Simplified auto_add_category_to_blog_agent function with constants
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
  
  -- Constants
  VISUAL_PROMPT_GENERATOR_NAME CONSTANT text := 'Visual Prompt Generator';
  EDGE_FUNCTION_URL CONSTANT text := '/functions/v1/invoke-system-prompt-agent';
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

  -- Call the edge function with error handling
  BEGIN
    SELECT content INTO edge_function_response
    FROM http((
      'POST',
      current_setting('app.supabase_url') || EDGE_FUNCTION_URL,
      ARRAY[
        http_header('Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      jsonb_build_object(
        'category', NEW.category,
        'theme', COALESCE(NEW.theme, 'General'),
        'description', COALESCE(NEW.description, ''),
        'user_id', NEW.user_id,
        'sample_posts', jsonb_build_array(
          jsonb_build_object(
            'title', NEW.title,
            'description', NEW.description
          )
        )
      )::text
    ));

    -- Extract generated prompt or use fallback
    generated_prompt_text := COALESCE(
      edge_function_response->>'system_prompt',
      format(FALLBACK_PROMPT_TEMPLATE, NEW.category, NEW.category)
    );

  EXCEPTION WHEN OTHERS THEN
    -- Use fallback template on any error
    generated_prompt_text := format(FALLBACK_PROMPT_TEMPLATE, NEW.category, NEW.category);
    RAISE WARNING 'Edge function call failed, using fallback prompt: %', SQLERRM;
  END;

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