-- Drop the cached_prompts table as it's no longer needed
-- We're moving to direct database queries instead of complex caching

DROP TABLE IF EXISTS public.cached_prompts;