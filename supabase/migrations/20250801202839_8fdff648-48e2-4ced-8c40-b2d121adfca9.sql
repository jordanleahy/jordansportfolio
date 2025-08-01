-- Update the auto_add_category_to_blog_agent function to call the generate-system-prompt edge function
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
BEGIN
  -- Skip if category already processed or is empty
  IF NEW.category IS NULL OR NEW.category = '' THEN
    RETURN NEW;
  END IF;

  -- Get the Blog Visual Prompt Generator agent
  SELECT id, system_prompts, supported_categories 
  INTO agent_id_var, current_prompts, current_categories
  FROM openai_agents 
  WHERE name = 'Blog Visual Prompt Generator' 
  AND user_id = NEW.user_id
  LIMIT 1;

  -- Skip if agent not found
  IF agent_id_var IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if category already exists in supported_categories
  IF current_categories IS NOT NULL AND NEW.category = ANY(current_categories) THEN
    RETURN NEW;
  END IF;

  -- Call the generate-system-prompt edge function
  BEGIN
    SELECT content INTO edge_function_response
    FROM http((
      'POST',
      current_setting('app.supabase_url') || '/functions/v1/generate-system-prompt',
      ARRAY[
        http_header('Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      jsonb_build_object(
        'category', NEW.category,
        'theme', COALESCE(NEW.theme, 'General'),
        'description', COALESCE(NEW.description, ''),
        'sample_posts', jsonb_build_array(
          jsonb_build_object(
            'title', NEW.title,
            'description', NEW.description
          )
        )
      )::text
    ));

    -- Extract the generated prompt from the response
    IF edge_function_response ? 'system_prompt' THEN
      generated_prompt_text := edge_function_response->>'system_prompt';
    ELSE
      -- Fallback to a simple template if the edge function fails
      generated_prompt_text := 'You are an expert at creating detailed, professional image generation prompts for ' || NEW.category || '-themed AI image generators. Focus on creating clear, specific prompts that generate high-quality, professional visuals suitable for ' || NEW.category || ' professionals. Use vector illustration style with clean, modern design and professional color palette. Always specify the aspect ratio in your prompt.';
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- If edge function call fails, use a simple fallback template
    generated_prompt_text := 'You are an expert at creating detailed, professional image generation prompts for ' || NEW.category || '-themed AI image generators. Focus on creating clear, specific prompts that generate high-quality, professional visuals suitable for ' || NEW.category || ' professionals. Use vector illustration style with clean, modern design and professional color palette. Always specify the aspect ratio in your prompt.';
  END;

  -- Create new prompt object
  new_prompt := jsonb_build_object(
    'category', NEW.category,
    'prompt', generated_prompt_text
  );

  -- Add to system_prompts array
  IF current_prompts IS NULL THEN
    updated_prompts := jsonb_build_array(new_prompt);
  ELSE
    updated_prompts := current_prompts || jsonb_build_array(new_prompt);
  END IF;

  -- Add to supported_categories array
  IF current_categories IS NULL THEN
    updated_categories := ARRAY[NEW.category];
  ELSE
    updated_categories := current_categories || NEW.category;
  END IF;

  -- Update the agent
  UPDATE openai_agents 
  SET 
    system_prompts = updated_prompts,
    supported_categories = updated_categories,
    updated_at = now()
  WHERE id = agent_id_var;

  RETURN NEW;
END;
$function$;