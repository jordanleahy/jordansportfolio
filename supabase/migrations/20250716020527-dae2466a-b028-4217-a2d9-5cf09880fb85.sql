-- Update category constraint to allow 'coding ai' category
ALTER TABLE public.social_media_posts 
DROP CONSTRAINT IF EXISTS check_valid_category;

ALTER TABLE public.social_media_posts 
ADD CONSTRAINT check_valid_category CHECK (category IN ('cdi', 'contracts', 'forms', 'coding ai'));