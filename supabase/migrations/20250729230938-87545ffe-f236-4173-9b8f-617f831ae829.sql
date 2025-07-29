-- Add image processing status fields to social_media_posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN IF NOT EXISTS image_16_9_status TEXT DEFAULT 'none' CHECK (image_16_9_status IN ('none', 'uploading', 'processing', 'complete', 'failed')),
ADD COLUMN IF NOT EXISTS image_9_16_status TEXT DEFAULT 'none' CHECK (image_9_16_status IN ('none', 'uploading', 'processing', 'complete', 'failed')),
ADD COLUMN IF NOT EXISTS image_3_4_status TEXT DEFAULT 'none' CHECK (image_3_4_status IN ('none', 'uploading', 'processing', 'complete', 'failed')),
ADD COLUMN IF NOT EXISTS image_4_3_status TEXT DEFAULT 'none' CHECK (image_4_3_status IN ('none', 'uploading', 'processing', 'complete', 'failed'));