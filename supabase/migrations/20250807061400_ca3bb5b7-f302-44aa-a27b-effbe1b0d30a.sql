-- Update theme_submissions table to enforce category uniqueness per user
-- First, remove the existing unique constraint on idempotency_key
ALTER TABLE public.theme_submissions DROP CONSTRAINT IF EXISTS theme_submissions_idempotency_key_key;

-- Add unique constraint on user_id + category combination
ALTER TABLE public.theme_submissions ADD CONSTRAINT theme_submissions_user_category_unique 
  UNIQUE (user_id, category);

-- Also update the themes table to enforce category uniqueness per user
ALTER TABLE public.themes ADD CONSTRAINT themes_user_category_unique 
  UNIQUE (user_id, category);