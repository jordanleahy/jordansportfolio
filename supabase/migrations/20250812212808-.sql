-- Performance optimization migration
-- Add indexes for frequently queried fields

-- Index for API usage tracking queries
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_user_created 
ON api_usage_tracking(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_function_success 
ON api_usage_tracking(function_name, success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_request_type 
ON api_usage_tracking(request_type, created_at DESC);

-- Index for cached prompts
CREATE INDEX IF NOT EXISTS idx_cached_prompts_user_category 
ON cached_prompts(user_id, category);

CREATE INDEX IF NOT EXISTS idx_cached_prompts_cache_key 
ON cached_prompts(cache_key, user_id);

CREATE INDEX IF NOT EXISTS idx_cached_prompts_last_accessed 
ON cached_prompts(last_accessed_at DESC);

-- Index for social media posts performance
CREATE INDEX IF NOT EXISTS idx_social_media_posts_user_theme 
ON social_media_posts(user_id, theme_id);

CREATE INDEX IF NOT EXISTS idx_social_media_posts_category_status 
ON social_media_posts(category, status);

CREATE INDEX IF NOT EXISTS idx_social_media_posts_image_status 
ON social_media_posts(image_1_1_status, image_16_9_status);

-- Index for monthly aggregates
CREATE INDEX IF NOT EXISTS idx_monthly_aggregates_user_month 
ON api_usage_monthly_aggregates(user_id, month_year DESC);

-- Add partial indexes for active/processing states
CREATE INDEX IF NOT EXISTS idx_posts_processing_status 
ON social_media_posts(user_id, created_at DESC) 
WHERE image_1_1_status = 'processing' OR image_16_9_status = 'processing';

-- Create function to clean up old cached prompts
CREATE OR REPLACE FUNCTION cleanup_old_cached_prompts()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to update cache hit count efficiently
CREATE OR REPLACE FUNCTION update_cache_hit(cache_key_param text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE cached_prompts 
  SET hit_count = hit_count + 1, 
      last_accessed_at = now() 
  WHERE cache_key = cache_key_param;
$$;