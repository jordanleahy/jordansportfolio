-- First, let's insert the missing Free Plan subscription for the current user
INSERT INTO user_subscriptions (user_id, tier_id, status, current_period_start, current_period_end)
SELECT 
  '7cc52029-5446-4dd9-9539-0f4e00bec044'::uuid,
  id,
  'active',
  now(),
  now() + interval '30 days'
FROM subscription_tiers 
WHERE name = 'Free'
ON CONFLICT (user_id, tier_id) DO NOTHING;

-- Create the trigger function to assign free plan to new users
CREATE OR REPLACE FUNCTION assign_free_plan_to_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  free_tier_id uuid;
BEGIN
  -- Get the Free tier ID
  SELECT id INTO free_tier_id
  FROM subscription_tiers
  WHERE name = 'Free'
  LIMIT 1;
  
  -- Insert free plan subscription for new user
  IF free_tier_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
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
      now() + interval '30 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_free_plan_to_new_user();