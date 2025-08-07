-- Add daily and monthly GPT image limits to subscription_tiers table
ALTER TABLE public.subscription_tiers 
ADD COLUMN max_gpt_images_daily integer,
ADD COLUMN max_gpt_images_monthly integer;

-- Update the Free Plan - GPT Images tier with the daily and monthly limits
UPDATE public.subscription_tiers 
SET 
  max_gpt_images_daily = 1,
  max_gpt_images_monthly = 30
WHERE name = 'Free Plan - GPT Images' AND price_cents = 0;