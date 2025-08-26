-- Remove the user creation function for theme structuring agent
-- This ensures only system-level agents exist

DROP FUNCTION IF EXISTS public.create_user_theme_structuring_agent(uuid);