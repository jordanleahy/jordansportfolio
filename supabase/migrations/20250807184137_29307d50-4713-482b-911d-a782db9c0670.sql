-- Update Free Plan tier limits
UPDATE public.subscription_tiers 
SET 
  max_gpt_images_daily = 1,
  max_gpt_images_monthly = 30,
  max_gpt_images = 30  -- Update legacy field for consistency
WHERE name = 'Free Plan - GPT Images' AND price_cents = 0;