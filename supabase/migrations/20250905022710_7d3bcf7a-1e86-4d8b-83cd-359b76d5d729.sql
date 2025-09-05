-- Drop the trigger that's causing insert failures
DROP TRIGGER IF EXISTS auto_add_category_trigger ON public.social_media_posts;

-- Drop the function that references the non-existent system_prompts column
DROP FUNCTION IF EXISTS public.auto_add_category_to_blog_agent();