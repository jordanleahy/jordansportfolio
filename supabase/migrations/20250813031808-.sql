-- Create Theme Structuring Agent and base system prompt
CREATE OR REPLACE FUNCTION public.insert_theme_structuring_agent()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  RAISE NOTICE 'Starting insert_theme_structuring_agent function';
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;

  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Theme Structuring Agent'
  ) INTO agent_exists;
  
  RAISE NOTICE 'Agent already exists: %', agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  BEGIN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
      owner, status, tags, notes, supported_categories, temperature, max_tokens
    ) VALUES (
      current_user_id,
      'Theme Structuring Agent',
      'Structures free text into strict ThemeImportData JSON (category, theme, theme_description, posts[]) enforcing character limits and valid status values.',
      'gpt-5-mini',
      'api_call',
      'Free text or loosely formatted JSON',
      'Strict ThemeImportData JSON',
      'on-demand',
      'Content Ops',
      'active',
      ARRAY['theme-structuring','json','validation','import'],
      'Pre-processes user input before import; mirrors structure-theme-input edge function behavior.',
      ARRAY['theme_structuring'],
      0.2,
      2000
    ) RETURNING id INTO insert_result;

    INSERT INTO public.system_prompts (
      agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
    ) VALUES (
      insert_result,
      current_user_id,
      'theme_structuring',
      $$You are a strict data structuring agent. Convert user text into EXACT JSON that matches this schema and constraints. Output ONLY raw JSON (no code fences, no commentary).

SCHEMA:
{
  "category": "string (1-100, optional)",
  "theme": "string (1-200, required)",
  "theme_description": "string (<=1000, optional)",
  "posts": [
    {
      "day": number (1-365, optional),
      "title": "string (1-500, required)",
      "story_description": "string (1-2000, required)",
      "status": "draft" | "scheduled" | "published" (default "draft")
    }
  ]
}

REQUIREMENTS:
- posts length: 1-100 max
- Trim whitespace, remove empty strings
- If category missing: set to "general"
- If status missing/invalid: set to "draft"
- If day missing: auto-increment starting at 1
- Map any fields like description -> story_description
- NEVER include markdown, explanations, or keys not in schema.$$,
      'Theme Structuring Agent',
      'Structures free text into strict ThemeImportData JSON (category, theme, theme_description, posts[]) enforcing character limits and valid status values.',
      'Content Ops',
      'Theme Structuring System Prompt',
      'Base system prompt for structuring free text into ThemeImportData JSON'
    );

    RAISE NOTICE 'Successfully inserted Theme Structuring Agent with ID: %', insert_result;
    RETURN 'SUCCESS: Theme Structuring Agent created with ID: ' || insert_result::text;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
END;
$function$;