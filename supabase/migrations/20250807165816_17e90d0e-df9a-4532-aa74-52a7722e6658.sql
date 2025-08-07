-- Phase 1: Update subscription tiers to GPT-image-1 only pricing
-- Add new column for GPT image generations
ALTER TABLE subscription_tiers ADD COLUMN max_gpt_images INTEGER DEFAULT 0;

-- Update existing tiers to combine image limits into GPT images
UPDATE subscription_tiers 
SET max_gpt_images = COALESCE(max_image_generations, 0) + COALESCE(max_dalle_images, 0)
WHERE max_gpt_images = 0;

-- Add new column to user_usage_tracking for GPT images
ALTER TABLE user_usage_tracking ADD COLUMN gpt_images_used INTEGER DEFAULT 0;

-- Migrate existing usage data (combine image_generations_used + dalle_images_used)
UPDATE user_usage_tracking 
SET gpt_images_used = COALESCE(image_generations_used, 0) + COALESCE(dalle_images_used, 0)
WHERE gpt_images_used = 0;

-- Update tier names and pricing to reflect GPT-image-1 focus
UPDATE subscription_tiers 
SET 
  name = 'Free Plan - GPT Images',
  max_gpt_images = 5,
  max_image_generations = 0,
  max_dalle_images = 0,
  max_text_generations = 0
WHERE name = 'Free Plan';

UPDATE subscription_tiers 
SET 
  name = 'Basic Plan - GPT Images',
  max_gpt_images = 100,
  price_cents = 520, -- Based on $0.052 per image * 10 images base + margin
  max_image_generations = 0,
  max_dalle_images = 0,
  max_text_generations = 0
WHERE name = 'Basic Plan';

-- Create a new Pro tier for higher usage
INSERT INTO subscription_tiers (
  name,
  max_gpt_images,
  max_image_generations,
  max_dalle_images, 
  max_text_generations,
  price_cents,
  billing_interval,
  is_active
) VALUES (
  'Pro Plan - GPT Images',
  500,
  0,
  0,
  0,
  2600, -- $26 for 500 images
  'month',
  true
) ON CONFLICT (name) DO UPDATE SET
  max_gpt_images = EXCLUDED.max_gpt_images,
  price_cents = EXCLUDED.price_cents;