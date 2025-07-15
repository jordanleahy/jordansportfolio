-- Add category field to social_media_posts table to distinguish between CDI and Contracts
ALTER TABLE public.social_media_posts 
ADD COLUMN category TEXT NOT NULL DEFAULT 'cdi';

-- Add check constraint to ensure valid categories
ALTER TABLE public.social_media_posts 
ADD CONSTRAINT check_valid_category CHECK (category IN ('cdi', 'contracts'));