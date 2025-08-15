-- Clean up orphaned records and fix foreign key constraints
-- First, remove the existing foreign key constraint on cached_prompts
ALTER TABLE public.cached_prompts 
DROP CONSTRAINT IF EXISTS cached_prompts_user_id_fkey;

-- Remove orphaned records from cached_prompts where user_id doesn't exist in auth.users
DELETE FROM public.cached_prompts 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Now safely add the CASCADE foreign key for cached_prompts
ALTER TABLE public.cached_prompts 
ADD CONSTRAINT cached_prompts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Clean up orphaned records from api_usage_tracking
DELETE FROM public.api_usage_tracking 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up orphaned records from api_usage_monthly_aggregates  
DELETE FROM public.api_usage_monthly_aggregates 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up orphaned records from api_usage_daily_aggregates
DELETE FROM public.api_usage_daily_aggregates 
WHERE user_id NOT IN (SELECT id FROM auth.users);