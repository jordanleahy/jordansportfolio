-- Fix foreign key constraint issues for user deletion
-- The cached_prompts table has a foreign key to auth.users that prevents deletion

-- First, let's remove the existing foreign key constraint if it exists
ALTER TABLE public.cached_prompts 
DROP CONSTRAINT IF EXISTS cached_prompts_user_id_fkey;

-- Also drop any other potential foreign key constraints to auth.users
ALTER TABLE public.cached_prompts 
DROP CONSTRAINT IF EXISTS cached_prompts_user_id_fkey1;

-- Now recreate the foreign key with CASCADE deletion
-- This will automatically delete cached_prompts when a user is deleted
ALTER TABLE public.cached_prompts 
ADD CONSTRAINT cached_prompts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Let's also check and fix any other tables that might have similar issues
-- Check if there are any other foreign keys to auth.users that need CASCADE

-- For any other tables that reference user_id, we should also set CASCADE deletion
-- Let's make sure api_usage_tracking also cascades properly
ALTER TABLE public.api_usage_tracking 
DROP CONSTRAINT IF EXISTS api_usage_tracking_user_id_fkey;

ALTER TABLE public.api_usage_tracking 
ADD CONSTRAINT api_usage_tracking_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Fix api_usage_monthly_aggregates
ALTER TABLE public.api_usage_monthly_aggregates 
DROP CONSTRAINT IF EXISTS api_usage_monthly_aggregates_user_id_fkey;

ALTER TABLE public.api_usage_monthly_aggregates 
ADD CONSTRAINT api_usage_monthly_aggregates_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Fix api_usage_daily_aggregates  
ALTER TABLE public.api_usage_daily_aggregates 
DROP CONSTRAINT IF EXISTS api_usage_daily_aggregates_user_id_fkey;

ALTER TABLE public.api_usage_daily_aggregates 
ADD CONSTRAINT api_usage_daily_aggregates_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;