-- Create unified enum types for consistent status handling across the application

-- Base processing status enum
CREATE TYPE public.base_processing_status AS ENUM (
  'not_started',
  'in_progress', 
  'completed',
  'failed'
);

-- Image generation status enum
CREATE TYPE public.image_generation_status AS ENUM (
  'none',
  'pending',
  'generating',
  'completed', 
  'failed'
);

-- Theme lifecycle status enum
CREATE TYPE public.theme_lifecycle_status AS ENUM (
  'pending',
  'generating',
  'ready',
  'completed',
  'failed'
);

-- Processing operation enum
CREATE TYPE public.processing_operation AS ENUM (
  'generate',
  'bulk_generate',
  'regenerate_prompt'
);

-- Sync status enum
CREATE TYPE public.sync_status AS ENUM (
  'pending',
  'synced',
  'failed'
);

-- Update existing tables to use new enum types
-- First, update themes table
ALTER TABLE public.themes 
ALTER COLUMN prompt_generation_status TYPE public.base_processing_status 
USING prompt_generation_status::public.base_processing_status;

ALTER TABLE public.themes 
ALTER COLUMN lifecycle_status TYPE public.theme_lifecycle_status 
USING lifecycle_status::public.theme_lifecycle_status;

-- Update social_media_posts table
ALTER TABLE public.social_media_posts 
ALTER COLUMN individual_prompt_status TYPE public.base_processing_status 
USING individual_prompt_status::public.base_processing_status;

-- Update image status columns to use new enum
ALTER TABLE public.social_media_posts 
ALTER COLUMN image_16_9_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_16_9_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_16_9_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_16_9_status::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_9_16_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_9_16_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_9_16_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_9_16_status::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_1_1_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_1_1_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_1_1_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_1_1_status::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_4_3_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_4_3_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_4_3_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_4_3_status::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_3_4_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_3_4_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_3_4_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_3_4_status::public.image_generation_status
END;

-- Update watermark status columns
ALTER TABLE public.social_media_posts 
ALTER COLUMN image_16_9_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_16_9_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_16_9_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_16_9_watermark_status::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_9_16_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_9_16_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_9_16_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_9_16_watermark_status::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_1_1_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_1_1_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_1_1_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_1_1_watermark_status::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_4_3_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_4_3_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_4_3_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_4_3_watermark_status::public.image_generation_status
END;

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_3_4_watermark_status TYPE public.image_generation_status 
USING CASE 
  WHEN image_3_4_watermark_status = 'complete' THEN 'completed'::public.image_generation_status
  WHEN image_3_4_watermark_status IS NULL THEN 'none'::public.image_generation_status
  ELSE image_3_4_watermark_status::public.image_generation_status
END;

-- Update API usage tracking sync_status
ALTER TABLE public.api_usage_tracking 
ALTER COLUMN sync_status TYPE public.sync_status 
USING sync_status::public.sync_status;

-- Update openai_usage_sync_logs if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'openai_usage_sync_logs' 
             AND column_name = 'sync_status') THEN
    EXECUTE 'ALTER TABLE public.openai_usage_sync_logs 
             ALTER COLUMN sync_status TYPE public.sync_status 
             USING sync_status::public.sync_status';
  END IF;
END $$;

-- Set default values for new enum columns
ALTER TABLE public.themes 
ALTER COLUMN prompt_generation_status SET DEFAULT 'not_started';

ALTER TABLE public.themes 
ALTER COLUMN lifecycle_status SET DEFAULT 'pending';

ALTER TABLE public.social_media_posts 
ALTER COLUMN individual_prompt_status SET DEFAULT 'not_started';

-- Set default values for image status columns
ALTER TABLE public.social_media_posts 
ALTER COLUMN image_16_9_status SET DEFAULT 'none';

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_9_16_status SET DEFAULT 'none';

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_1_1_status SET DEFAULT 'none';

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_4_3_status SET DEFAULT 'none';

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_3_4_status SET DEFAULT 'none';

-- Set default values for watermark status columns
ALTER TABLE public.social_media_posts 
ALTER COLUMN image_16_9_watermark_status SET DEFAULT 'none';

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_9_16_watermark_status SET DEFAULT 'none';

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_1_1_watermark_status SET DEFAULT 'none';

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_4_3_watermark_status SET DEFAULT 'none';

ALTER TABLE public.social_media_posts 
ALTER COLUMN image_3_4_watermark_status SET DEFAULT 'none';

-- Update API usage tracking sync_status default
ALTER TABLE public.api_usage_tracking 
ALTER COLUMN sync_status SET DEFAULT 'pending';

-- Create indexes for better query performance on status columns
CREATE INDEX IF NOT EXISTS idx_themes_prompt_generation_status ON public.themes(prompt_generation_status);
CREATE INDEX IF NOT EXISTS idx_themes_lifecycle_status ON public.themes(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_posts_individual_prompt_status ON public.social_media_posts(individual_prompt_status);
CREATE INDEX IF NOT EXISTS idx_api_usage_sync_status ON public.api_usage_tracking(sync_status);