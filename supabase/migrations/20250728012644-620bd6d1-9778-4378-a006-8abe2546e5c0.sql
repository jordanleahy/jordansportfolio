-- Fix cached_prompts table structure and RLS policies

-- First, add new columns for enhanced caching
ALTER TABLE public.cached_prompts 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS hit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Make user_id NOT NULL (but allow service role to bypass this)
-- We'll handle this with policies instead of constraints to allow service role access

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cached_prompts_cache_key ON public.cached_prompts(cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_prompts_category ON public.cached_prompts(category);
CREATE INDEX IF NOT EXISTS idx_cached_prompts_expires_at ON public.cached_prompts(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_prompts_user_category ON public.cached_prompts(user_id, category);

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can create their own cached prompts" ON public.cached_prompts;
DROP POLICY IF EXISTS "Users can update their own cached prompts" ON public.cached_prompts;
DROP POLICY IF EXISTS "Users can view their own cached prompts" ON public.cached_prompts;

-- Create enhanced RLS policies
CREATE POLICY "Users can view their own cached prompts" 
ON public.cached_prompts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cached prompts" 
ON public.cached_prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cached prompts" 
ON public.cached_prompts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cached prompts" 
ON public.cached_prompts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can manage all cached prompts (for edge functions)
CREATE POLICY "Service role can manage all cached prompts" 
ON public.cached_prompts 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.cached_prompts 
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create function to update cache hit statistics
CREATE OR REPLACE FUNCTION public.update_cache_hit(cache_key_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.cached_prompts 
  SET 
    hit_count = hit_count + 1,
    last_accessed_at = now()
  WHERE cache_key = cache_key_param;
END;
$$;

-- Create function to get cache statistics
CREATE OR REPLACE FUNCTION public.get_cache_stats(user_id_param UUID DEFAULT NULL)
RETURNS TABLE(
  total_prompts BIGINT,
  expired_prompts BIGINT,
  total_hits BIGINT,
  categories_count BIGINT,
  avg_hit_count NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_prompts,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < now()) as expired_prompts,
    SUM(hit_count) as total_hits,
    COUNT(DISTINCT category) as categories_count,
    AVG(hit_count) as avg_hit_count
  FROM public.cached_prompts
  WHERE (user_id_param IS NULL OR user_id = user_id_param);
END;
$$;