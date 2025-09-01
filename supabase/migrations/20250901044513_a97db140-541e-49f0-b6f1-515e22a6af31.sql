-- Enable real-time replication for system_prompts table
ALTER TABLE public.system_prompts REPLICA IDENTITY FULL;

-- Add system_prompts to the realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.social_media_posts,
  public.themes,
  public.system_prompts,
  public.color_themes,
  public.openai_agents,
  public.vendors,
  public.agent_templates,
  public.agent_categories,
  public.agent_model_options,
  public.api_usage_tracking;

-- Create index for fast system prompt lookups by theme_id
CREATE INDEX IF NOT EXISTS idx_system_prompts_theme_user_created 
ON public.system_prompts (theme_id, user_id, created_at DESC);