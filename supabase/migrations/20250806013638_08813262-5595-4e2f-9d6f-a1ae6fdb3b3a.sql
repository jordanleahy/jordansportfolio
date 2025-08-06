-- Add Free Plan to subscription tiers
INSERT INTO public.subscription_tiers (
  name,
  price_cents,
  billing_interval,
  max_image_generations,
  max_dalle_images,
  max_text_generations,
  is_active
) VALUES (
  'Free Plan',
  0,
  'month',
  5,
  0,
  0,
  true
);