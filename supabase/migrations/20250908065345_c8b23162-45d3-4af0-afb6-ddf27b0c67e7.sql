-- First, update the function to handle enum types properly
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
  -- Get theme_id from the updated post
  theme_id_val := NEW.theme_id;
  
  IF theme_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count completed posts for this theme (cast to text for comparison)
  SELECT COUNT(*) INTO completed_count
  FROM public.social_media_posts 
  WHERE theme_id = theme_id_val 
    AND individual_prompt_status::text = 'completed';
  
  -- Count total posts for this theme
  SELECT COUNT(*) INTO total_count
  FROM public.social_media_posts 
  WHERE theme_id = theme_id_val;
  
  -- Update theme completion status (cast enum values properly)
  UPDATE public.themes 
  SET 
    prompt_completion_count = completed_count,
    total_posts_count = total_count,
    prompt_generation_status = CASE 
      WHEN completed_count = 0 THEN 'not_started'::text
      WHEN completed_count = total_count THEN 'completed'::text
      ELSE 'in_progress'::text
    END::public.base_processing_status,
    updated_at = now()
  WHERE id = theme_id_val;
  
  RETURN NEW;
END;
$$;

-- Drop existing types (will be recreated)
DROP TYPE IF EXISTS public.base_processing_status CASCADE;
DROP TYPE IF EXISTS public.image_generation_status CASCADE;
DROP TYPE IF EXISTS public.theme_lifecycle_status CASCADE;
DROP TYPE IF EXISTS public.processing_operation CASCADE;
DROP TYPE IF EXISTS public.sync_status CASCADE;

-- Create unified enum types
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

CREATE TYPE public.sync_status AS ENUM (
  'pending',
  'synced',
  'failed'
);

-- Remove defaults first
ALTER TABLE public.themes ALTER COLUMN prompt_generation_status DROP DEFAULT;
ALTER TABLE public.themes ALTER COLUMN lifecycle_status DROP DEFAULT;
ALTER TABLE public.social_media_posts ALTER COLUMN individual_prompt_status DROP DEFAULT;

-- Update table columns to use enum types
ALTER TABLE public.themes 
ALTER COLUMN prompt_generation_status TYPE public.base_processing_status 
USING prompt_generation_status::public.base_processing_status;

ALTER TABLE public.themes 
ALTER COLUMN lifecycle_status TYPE public.theme_lifecycle_status 
USING lifecycle_status::public.theme_lifecycle_status;

ALTER TABLE public.social_media_posts 
ALTER COLUMN individual_prompt_status TYPE public.base_processing_status 
USING individual_prompt_status::public.base_processing_status;

-- Update image status columns with conversion
ALTER TABLE public.social_media_posts 
ALTER COLUMN image_16_9_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_16_9_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_16_9_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_16_9_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_9_16_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_9_16_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_9_16_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_9_16_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_1_1_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_1_1_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_1_1_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_1_1_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_4_3_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_4_3_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_4_3_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_4_3_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_3_4_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_3_4_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_3_4_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_3_4_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

-- Update watermark status columns
ALTER TABLE public.social_media_posts 
ALTER COLUMN image_16_9_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_16_9_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_16_9_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_16_9_watermark_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_9_16_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_9_16_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_9_16_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_9_16_watermark_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_1_1_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_1_1_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_1_1_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_1_1_watermark_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_4_3_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_4_3_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_4_3_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_4_3_watermark_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_3_4_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_3_4_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_3_4_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE COALESCE(image_3_4_watermark_status::public.image_generation_status, 'none'::public.image_generation_status)
END;

-- Set new default values
ALTER TABLE public.themes ALTER COLUMN prompt_generation_status SET DEFAULT 'not_started';
ALTER TABLE public.themes ALTER COLUMN lifecycle_status SET DEFAULT 'pending';
ALTER TABLE public.social_media_posts ALTER COLUMN individual_prompt_status SET DEFAULT 'not_started';

-- Set image status defaults
ALTER TABLE public.social_media_posts ALTER COLUMN image_16_9_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_9_16_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_1_1_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_4_3_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_3_4_status SET DEFAULT 'none';

-- Set watermark status defaults
ALTER TABLE public.social_media_posts ALTER COLUMN image_16_9_watermark_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_9_16_watermark_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_1_1_watermark_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_4_3_watermark_status SET DEFAULT 'none';
ALTER TABLE public.social_media_posts ALTER COLUMN image_3_4_watermark_status SET DEFAULT 'none';

-- Recreate trigger
CREATE TRIGGER update_theme_completion_status_trigger
  AFTER UPDATE OF individual_prompt_status ON public.social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_theme_completion_status();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_themes_prompt_generation_status ON public.themes(prompt_generation_status);
CREATE INDEX IF NOT EXISTS idx_themes_lifecycle_status ON public.themes(lifecycle_status); 
CREATE INDEX IF NOT EXISTS idx_posts_individual_prompt_status ON public.social_media_posts(individual_prompt_status);