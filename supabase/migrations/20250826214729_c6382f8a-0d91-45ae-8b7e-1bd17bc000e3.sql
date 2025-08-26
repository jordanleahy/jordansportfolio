-- Remove dead triage and theme structuring system
DELETE FROM openai_agents WHERE name = 'Triage Orchestra Agent';

-- Remove unused theme structuring agent (no implementation exists)
DELETE FROM openai_agents WHERE name = 'Theme Structuring Agent';

-- Drop the unused insert functions
DROP FUNCTION IF EXISTS public.insert_triage_orchestra_agent();
DROP FUNCTION IF EXISTS public.insert_theme_structuring_agent();