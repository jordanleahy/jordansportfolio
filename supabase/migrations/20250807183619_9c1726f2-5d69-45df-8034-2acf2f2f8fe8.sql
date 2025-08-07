-- Add daily tracking fields to user_usage_tracking table
ALTER TABLE public.user_usage_tracking 
ADD COLUMN daily_usage_date date,
ADD COLUMN gpt_images_used_today integer DEFAULT 0;