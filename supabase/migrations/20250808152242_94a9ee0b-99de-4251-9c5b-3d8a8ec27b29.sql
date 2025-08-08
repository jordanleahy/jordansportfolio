-- Create a hidden Admin subscription tier with high limits if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.subscription_tiers WHERE name = 'Admin'
  ) THEN
    INSERT INTO public.subscription_tiers (
      name,
      price_cents,
      billing_interval,
      is_active,
      max_gpt_images,
      max_gpt_images_daily,
      max_gpt_images_monthly,
      stripe_price_id
    ) VALUES (
      'Admin',
      0,
      'month',
      false,
      100000,
      100000,
      100000,
      NULL
    );
  ELSE
    -- Ensure Admin tier remains free, hidden, and with high limits
    UPDATE public.subscription_tiers
    SET 
      price_cents = 0,
      billing_interval = 'month',
      is_active = false,
      max_gpt_images = COALESCE(max_gpt_images, 100000),
      max_gpt_images_daily = COALESCE(max_gpt_images_daily, 100000),
      max_gpt_images_monthly = COALESCE(max_gpt_images_monthly, 100000)
    WHERE name = 'Admin';
  END IF;
END $$;