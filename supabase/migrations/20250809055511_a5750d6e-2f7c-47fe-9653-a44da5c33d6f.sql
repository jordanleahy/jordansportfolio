-- First, let's check what user_subscriptions records exist
-- Then let's manually insert the correct subscription for your user

-- For user ID: afebf0a8-b17d-4383-b81f-d599aaef1d18 (from the auth logs)
-- Insert/update their subscription to Starter plan

INSERT INTO user_subscriptions (
  user_id, 
  tier_id, 
  stripe_subscription_id, 
  stripe_customer_id, 
  status, 
  current_period_start, 
  current_period_end
) VALUES (
  'afebf0a8-b17d-4383-b81f-d599aaef1d18',
  'ba5d4bde-1e56-434d-93dc-2c4b06bb5f43',  -- Starter tier ID
  'sub_placeholder_from_stripe',  -- We'll update this later
  'cus_placeholder_from_stripe',  -- We'll update this later
  'active',
  now(),
  now() + interval '1 month'
) 
ON CONFLICT (user_id) 
DO UPDATE SET 
  tier_id = 'ba5d4bde-1e56-434d-93dc-2c4b06bb5f43',
  status = 'active',
  updated_at = now();