-- Fix security issues for newly added functions
-- Add SET search_path = 'public' to secure functions

DROP FUNCTION IF EXISTS cleanup_old_cached_prompts();
DROP FUNCTION IF EXISTS update_cache_hit(text);

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION cleanup_old_cached_prompts()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete cached prompts older than 30 days with low hit count
  DELETE FROM cached_prompts 
  WHERE created_at < now() - INTERVAL '30 days'
    AND hit_count < 3;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create function to update cache hit count efficiently with proper security
CREATE OR REPLACE FUNCTION update_cache_hit(cache_key_param text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE cached_prompts 
  SET hit_count = hit_count + 1, 
      last_accessed_at = now() 
  WHERE cache_key = cache_key_param;
$$;