-- Update the trigger function to use specific Free Plan UUID
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_tier_id uuid := '4204f405-c592-48b1-9df8-b89e01f42db4'; -- Free Plan tier ID
BEGIN
  -- Create user subscription with Free Plan tier
  INSERT INTO public.user_subscriptions (
    user_id,
    tier_id,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    free_tier_id,
    'active',
    now(),
    now() + interval '1 year' -- Free plan gets 1 year period
  );

  -- Create initial usage tracking record
  INSERT INTO public.api_usage_tracking (
    user_id,
    function_name,
    model_used,
    request_type,
    success,
    estimated_cost,
    created_at
  ) VALUES (
    NEW.id,
    'user_signup',
    'system',
    'account_creation',
    true,
    0.00,
    now()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user subscription: %', SQLERRM;
    RETURN NEW;
END;
$$;