-- Create Theme Structuring Agent directly since the function requires authentication
-- First, we need to create this as a system-level template or for a specific user
-- Let's check if there are any existing agents to see the pattern

-- For now, I'll create this as a template in the agent_templates table instead
-- This way users can create their own instance when needed

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
    'temperature', 0.2,
    'max_tokens', 2000,
    'system_prompt', 'You are a strict data structuring agent. Convert user text into EXACT JSON that matches this schema and constraints. Output ONLY raw JSON (no code fences, no commentary).

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
- NEVER include markdown, explanations, or keys not in schema.'
  )
)
ON CONFLICT (user_id, name) DO NOTHING;