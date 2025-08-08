-- Drop the user_usage_tracking table as it's redundant
-- All usage data is now tracked in api_usage_tracking table which provides real-time accurate data

-- First drop any triggers or functions that reference this table
DROP TRIGGER IF EXISTS update_user_usage_tracking_updated_at ON public.user_usage_tracking;

-- Drop the table
DROP TABLE IF EXISTS public.user_usage_tracking;