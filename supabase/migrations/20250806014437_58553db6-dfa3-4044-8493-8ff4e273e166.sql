-- Create a function to automatically assign Free Plan to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the Free Plan ID
  SELECT id INTO free_plan_id 
  FROM public.subscription_tiers 
  WHERE name = 'Free Plan' AND price_cents = 0 
  LIMIT 1;
  
  -- Only proceed if Free Plan exists
  IF free_plan_id IS NOT NULL THEN
    -- Insert user subscription with Free Plan
    INSERT INTO public.user_subscriptions (
      user_id,
      tier_id,
      status,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      free_plan_id,
      'active',
      NOW(),
      NOW() + INTERVAL '1 month'
    );
    
    -- Create initial usage tracking record
    INSERT INTO public.user_usage_tracking (
      user_id,
      billing_period_start,
      billing_period_end,
      image_generations_used,
      dalle_images_used,
      text_generations_used
    ) VALUES (
      NEW.id,
      DATE_TRUNC('month', NOW()),
      DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day',
      0,
      0,
      0
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign Free Plan to new users
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();