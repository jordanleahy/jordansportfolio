-- Update the Free Plan subscription tier to set monthly limit to 30
UPDATE public.subscription_tiers 
SET max_gpt_images_monthly = 30
WHERE name = 'Free Plan' AND price_cents = 0;