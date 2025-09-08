-- Drop ALL triggers that might interfere
DROP TRIGGER IF EXISTS trigger_invalidate_theme_cache ON public.themes;
DROP TRIGGER IF EXISTS update_theme_completion_status_trigger ON public.social_media_posts;
DROP TRIGGER IF EXISTS theme_lifecycle_trigger ON public.themes;
DROP TRIGGER IF EXISTS update_lifecycle_status_trigger ON public.themes;

-- Now proceed with enum creation and migration
CREATE OR REPLACE FUNCTION public.update_theme_completion_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  theme_id_val uuid;
  completed_count integer;
  total_count integer;
BEGIN
  theme_id_val := NEW.theme_id;
  
  IF theme_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT COUNT(*) INTO completed_count
  FROM public.social_media_posts 
  WHERE theme_id = theme_id_val 
    AND individual_prompt_status::text = 'completed';
  
  SELECT COUNT(*) INTO total_count
  FROM public.social_media_posts 
  WHERE theme_id = theme_id_val;
  
  UPDATE public.themes 
  SET 
    prompt_completion_count = completed_count,
    total_posts_count = total_count,
    prompt_generation_status = CASE 
      WHEN completed_count = 0 THEN 'not_started'::text
      WHEN completed_count = total_count THEN 'completed'::text
      ELSE 'in_progress'::text
    END,
    updated_at = now()
  WHERE id = theme_id_val;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate enum types
DROP TYPE IF EXISTS public.base_processing_status CASCADE;
DROP TYPE IF EXISTS public.image_generation_status CASCADE;
DROP TYPE IF EXISTS public.theme_lifecycle_status CASCADE;
DROP TYPE IF EXISTS public.processing_operation CASCADE;
DROP TYPE IF EXISTS public.sync_status CASCADE;

CREATE TYPE public.base_processing_status AS ENUM (
  'not_started',
  'in_progress', 
  'completed',
  'failed'
);

CREATE TYPE public.image_generation_status AS ENUM (
  'none',
  'pending',
  'generating',
  'completed', 
  'failed'
);

CREATE TYPE public.theme_lifecycle_status AS ENUM (
  'pending',
  'generating',
  'ready',
  'completed',
  'failed'
);

CREATE TYPE public.processing_operation AS ENUM (
  'generate',
  'bulk_generate',
  'regenerate_prompt'
);

-- Remove defaults and update column types
ALTER TABLE public.themes ALTER COLUMN prompt_generation_status DROP DEFAULT;
ALTER TABLE public.themes ALTER COLUMN lifecycle_status DROP DEFAULT;  
ALTER TABLE public.social_media_posts ALTER COLUMN individual_prompt_status DROP DEFAULT;

-- Convert columns to use new enum types
ALTER TABLE public.themes 
ALTER COLUMN prompt_generation_status TYPE public.base_processing_status 
USING prompt_generation_status::public.base_processing_status;

ALTER TABLE public.themes 
ALTER COLUMN lifecycle_status TYPE public.theme_lifecycle_status 
USING lifecycle_status::public.theme_lifecycle_status;

ALTER TABLE public.social_media_posts 
ALTER COLUMN individual_prompt_status TYPE public.base_processing_status 
USING individual_prompt_status::public.base_processing_status;

-- Convert image status columns (handle 'complete' -> 'completed')
ALTER TABLE public.social_media_posts 
ALTER COLUMN image_16_9_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_16_9_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_16_9_status, 'none')::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_9_16_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_9_16_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_9_16_status, 'none')::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_1_1_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_1_1_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_1_1_status, 'none')::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_4_3_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_4_3_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_4_3_status, 'none')::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_3_4_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_3_4_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_3_4_status, 'none')::public.image_generation_status
END;

-- Convert watermark status columns
ALTER TABLE public.social_media_posts 
ALTER COLUMN image_16_9_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_16_9_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_16_9_watermark_status, 'none')::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_9_16_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_9_16_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_9_16_watermark_status, 'none')::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_1_1_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_1_1_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_1_1_watermark_status, 'none')::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_4_3_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_4_3_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_4_3_watermark_status, 'none')::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_3_4_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_3_4_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  ELSE COALESCE(image_3_4_watermark_status, 'none')::public.image_generation_status
END;

-- Set new defaults
ALTER TABLE public.themes ALTER COLUMN prompt_generation_status SET DEFAULT 'not_started';
ALTER TABLE public.themes ALTER COLUMN lifecycle_status SET DEFAULT 'pending';
ALTER TABLE public.social_media_posts ALTER COLUMN individual_prompt_status SET DEFAULT 'not_started';

-- Set image status defaults
ALTER TABLE public.social_media_posts ALTER COLUMN image_16_9_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_9_16_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_1_1_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_4_3_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_3_4_status SET DEFAULT 'none';

-- Set watermark defaults
ALTER TABLE public.social_media_posts ALTER COLUMN image_16_9_watermark_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_9_16_watermark_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_1_1_watermark_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_4_3_watermark_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_3_4_watermark_status SET DEFAULT 'none';

-- Update function to work with enum types properly
CREATE OR REPLACE FUNCTION public.update_theme_completion_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  theme_id_val uuid;
  completed_count integer;
  total_count integer;
BEGIN
  theme_id_val := NEW.theme_id;
  
  IF theme_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT COUNT(*) INTO completed_count
  FROM public.social_media_posts 
  WHERE theme_id = theme_id_val 
    AND individual_prompt_status = 'completed'::public.base_processing_status;
  
  SELECT COUNT(*) INTO total_count
  FROM public.social_media_posts 
  WHERE theme_id = theme_id_val;
  
  UPDATE public.themes 
  SET 
    prompt_completion_count = completed_count,
    total_posts_count = total_count,
    prompt_generation_status = CASE 
      WHEN completed_count = 0 THEN 'not_started'::public.base_processing_status
      WHEN completed_count = total_count THEN 'completed'::public.base_processing_status
      ELSE 'in_progress'::public.base_processing_status
    END,
    updated_at = now()
  WHERE id = theme_id_val;
  
  RETURN NEW;
END;
$$;

-- Recreate only the necessary trigger
CREATE TRIGGER update_theme_completion_status_trigger
  AFTER UPDATE OF individual_prompt_status ON public.social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_theme_completion_status();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_themes_prompt_generation_status ON public.themes(prompt_generation_status);
CREATE INDEX IF NOT EXISTS idx_themes_lifecycle_status ON public.themes(lifecycle_status); 
CREATE INDEX IF NOT EXISTS idx_posts_individual_prompt_status ON public.social_media_posts(individual_prompt_status);