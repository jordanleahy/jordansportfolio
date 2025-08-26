-- Create Theme Structuring Agent with proper GPT-5 compatibility
-- This creates both the agent template and ensures users can instantiate it

-- First, create the system-level agent template with GPT-5 compatible parameters
INSERT INTO public.agent_templates (
  user_id,
  name,
  description,
  category,
  is_system,
  is_active,
  template_data
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- System user placeholder
  'Theme Structuring Agent',
  'Structures free text into strict ThemeImportData JSON (category, theme, theme_description, posts[]) enforcing character limits and valid status values.',
  'theme_structuring',
  true,
  true,
  jsonb_build_object(
    'name', 'Theme Structuring Agent',
    'purpose', 'Structures free text into strict ThemeImportData JSON (category, theme, theme_description, posts[]) enforcing character limits and valid status values.',
    'model_version', 'gpt-5-mini-2025-08-07',
    'trigger', 'api_call',
    'input_source', 'Free text or loosely formatted JSON',
    'output_target', 'Strict ThemeImportData JSON',
    'schedule', 'on-demand',
    'owner', 'Content Ops',
    'status', 'active',
    'tags', ARRAY['theme-structuring','json','validation','import'],
    'notes', 'Pre-processes user input before import; mirrors structure-theme-input edge function behavior.',
    'supported_categories', ARRAY['theme_structuring'],
    -- GPT-5 compatible parameters (no temperature, use max_completion_tokens)
    'max_completion_tokens', 2000
  )
)
ON CONFLICT (user_id, name) DO NOTHING;

-- Create a function to help users create their own theme structuring agent instance
-- This will create both the agent and system prompt properly
CREATE OR REPLACE FUNCTION public.create_user_theme_structuring_agent(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  agent_id uuid;
  prompt_id uuid;
BEGIN
  -- Check if user already has this agent
  SELECT id INTO agent_id
  FROM public.openai_agents 
  WHERE user_id = p_user_id AND name = 'Theme Structuring Agent';
  
  IF agent_id IS NOT NULL THEN
    RETURN agent_id;
  END IF;
  
  -- Create the agent with GPT-5 compatible parameters
  INSERT INTO public.openai_agents (
    user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
    owner, status, tags, notes, supported_categories, max_completion_tokens
  ) VALUES (
    p_user_id,
    'Theme Structuring Agent',
    'Structures free text into strict ThemeImportData JSON (category, theme, theme_description, posts[]) enforcing character limits and valid status values.',
    'gpt-5-mini-2025-08-07',
    'api_call',
    'Free text or loosely formatted JSON',
    'Strict ThemeImportData JSON',
    'on-demand',
    'Content Ops',
    'active',
    ARRAY['theme-structuring','json','validation','import'],
    'Pre-processes user input before import; mirrors structure-theme-input edge function behavior.',
    ARRAY['theme_structuring'],
    2000
  ) RETURNING id INTO agent_id;
  
  -- Create the system prompt
  INSERT INTO public.system_prompts (
    agent_id, user_id, category, prompt_text, agent_name, agent_purpose, agent_owner, name, description
  ) VALUES (
    agent_id,
    p_user_id,
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
  
  RETURN agent_id;
END;
$$;