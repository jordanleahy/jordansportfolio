-- Add watermarked image URL and status fields per aspect ratio
ALTER TABLE public.social_media_posts
  ADD COLUMN IF NOT EXISTS image_16_9_watermark_url text,
  ADD COLUMN IF NOT EXISTS image_9_16_watermark_url text,
  ADD COLUMN IF NOT EXISTS image_3_4_watermark_url text,
  ADD COLUMN IF NOT EXISTS image_4_3_watermark_url text,
  ADD COLUMN IF NOT EXISTS image_1_1_watermark_url text,
  ADD COLUMN IF NOT EXISTS image_16_9_watermark_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS image_9_16_watermark_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS image_3_4_watermark_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS image_4_3_watermark_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS image_1_1_watermark_status text DEFAULT 'none';

-- Optional: comment descriptions for clarity
COMMENT ON COLUMN public.social_media_posts.image_16_9_watermark_url IS 'Public URL of 16:9 watermarked image';
COMMENT ON COLUMN public.social_media_posts.image_9_16_watermark_url IS 'Public URL of 9:16 watermarked image';
COMMENT ON COLUMN public.social_media_posts.image_3_4_watermark_url IS 'Public URL of 3:4 watermarked image';
COMMENT ON COLUMN public.social_media_posts.image_4_3_watermark_url IS 'Public URL of 4:3 watermarked image';
COMMENT ON COLUMN public.social_media_posts.image_1_1_watermark_url IS 'Public URL of 1:1 watermarked image';
COMMENT ON COLUMN public.social_media_posts.image_16_9_watermark_status IS 'Watermark processing status for 16:9 image (none|processing|complete|failed)';
COMMENT ON COLUMN public.social_media_posts.image_9_16_watermark_status IS 'Watermark processing status for 9:16 image (none|processing|complete|failed)';
COMMENT ON COLUMN public.social_media_posts.image_3_4_watermark_status IS 'Watermark processing status for 3:4 image (none|processing|complete|failed)';
COMMENT ON COLUMN public.social_media_posts.image_4_3_watermark_status IS 'Watermark processing status for 4:3 image (none|processing|complete|failed)';
COMMENT ON COLUMN public.social_media_posts.image_1_1_watermark_status IS 'Watermark processing status for 1:1 image (none|processing|complete|failed)';