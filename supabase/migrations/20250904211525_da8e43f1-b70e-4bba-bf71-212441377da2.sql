-- Security fix: Add search_path to database functions to prevent SQL injection attacks

-- Fix all functions that are missing SET search_path = public
ALTER FUNCTION public.update_daily_work_summaries_updated_at() SET search_path = public;
ALTER FUNCTION public.get_agent_name(text) SET search_path = public;
ALTER FUNCTION public.update_agent_constants_updated_at() SET search_path = public;
ALTER FUNCTION public.update_agent_templates_updated_at() SET search_path = public;
ALTER FUNCTION public.update_agent_categories_updated_at() SET search_path = public;
ALTER FUNCTION public.update_agent_model_options_updated_at() SET search_path = public;
ALTER FUNCTION public.check_theme_submission_rate_limit(uuid, integer, integer) SET search_path = public;
ALTER FUNCTION public.update_characters_updated_at() SET search_path = public;
ALTER FUNCTION public.update_lifecycle_status_trigger() SET search_path = public;
ALTER FUNCTION public.update_street_vision_generations_updated_at() SET search_path = public;
ALTER FUNCTION public.update_theme_completion_status() SET search_path = public;
ALTER FUNCTION public.update_shared_collection_1_1(uuid, uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.log_submission_event(uuid, uuid, text, jsonb, integer) SET search_path = public;
ALTER FUNCTION public.get_submission_analytics(uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_old_submissions() SET search_path = public;
ALTER FUNCTION public.update_openai_usage_sync_logs_updated_at() SET search_path = public;
ALTER FUNCTION public.update_monthly_aggregates_updated_at() SET search_path = public;
ALTER FUNCTION public.get_or_create_monthly_aggregate(uuid, date) SET search_path = public;
ALTER FUNCTION public.invalidate_theme_cache_on_status_change() SET search_path = public;
ALTER FUNCTION public.get_user_roles(uuid) SET search_path = public;
ALTER FUNCTION public.refresh_monthly_aggregates(date, uuid) SET search_path = public;
ALTER FUNCTION public.update_monthly_aggregate_on_usage() SET search_path = public;
ALTER FUNCTION public.cleanup_duplicate_posts(uuid, text, uuid, boolean) SET search_path = public;
ALTER FUNCTION public.publish_shared_collection_1_1(text, text, text, uuid[], uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.publish_shared_collection_16_9(text, text, text, uuid[], text, uuid) SET search_path = public;
ALTER FUNCTION public.add_coding_ai_data_for_user(uuid) SET search_path = public;
ALTER FUNCTION public.fix_hardcoded_aspect_ratio_in_prompts() SET search_path = public;
ALTER FUNCTION public.insert_cdi_content() SET search_path = public;

-- Add missing has_role function for RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;