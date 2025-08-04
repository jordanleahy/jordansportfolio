-- Phase 1: Database Schema Updates for Theme-Anchored System Prompts

-- Add theme-related columns to system_prompts table
ALTER TABLE public.system_prompts 
ADD COLUMN IF NOT EXISTS theme text,
ADD COLUMN IF NOT EXISTS theme_description text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_prompts_theme ON public.system_prompts(theme);
CREATE INDEX IF NOT EXISTS idx_system_prompts_user_theme ON public.system_prompts(user_id, theme);
CREATE INDEX IF NOT EXISTS idx_system_prompts_category_theme ON public.system_prompts(category, theme);

-- Update the auto_add_category_to_blog_agent function to be theme-aware
CREATE OR REPLACE FUNCTION public.auto_add_category_to_blog_agent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  agent_id_var uuid;
  current_prompts jsonb;
  current_categories text[];
  new_prompt jsonb;
  updated_prompts jsonb;
  updated_categories text[];
  
  -- Constants - Using centralized lookup instead of hardcoded values
  VISUAL_PROMPT_GENERATOR_NAME CONSTANT text := get_agent_name('VISUAL_PROMPT_GENERATOR');
  THEME_FALLBACK_PROMPT CONSTANT text := 'You are an expert at creating detailed, professional image generation prompts for %s-themed AI image generators with %s category context. Focus on creating clear, specific prompts that generate high-quality, professional visuals suitable for %s professionals. Use vector illustration style with clean, modern design and professional color palette. Always specify the aspect ratio in your prompt.';
BEGIN
  -- Input validation and early return conditions
  IF NEW.category IS NULL OR NEW.category = '' THEN
    RETURN NEW;
  END IF;

  -- Get the Visual Prompt Generator agent using centralized name lookup
  SELECT id, system_prompts, supported_categories 
  INTO agent_id_var, current_prompts, current_categories
  FROM openai_agents 
  WHERE name = VISUAL_PROMPT_GENERATOR_NAME 
  AND user_id = NEW.user_id
  LIMIT 1;

  -- Early return if agent not found or category already exists
  IF agent_id_var IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF current_categories IS NOT NULL AND NEW.category = ANY(current_categories) THEN
    RETURN NEW;
  END IF;

  -- Use theme-aware fallback prompt
  new_prompt := jsonb_build_object(
    'category', NEW.category,
    'theme', COALESCE(NEW.theme, NEW.category),
    'prompt', format(THEME_FALLBACK_PROMPT, COALESCE(NEW.theme, NEW.category), NEW.category, NEW.category)
  );

  updated_prompts := COALESCE(current_prompts, '[]'::jsonb) || jsonb_build_array(new_prompt);
  updated_categories := COALESCE(current_categories, '{}'::text[]) || NEW.category;

  -- Single atomic update
  UPDATE openai_agents 
  SET 
    system_prompts = updated_prompts,
    supported_categories = updated_categories,
    updated_at = now()
  WHERE id = agent_id_var;

  RETURN NEW;
END;
$function$;