-- Add cover_image_url to themes table
ALTER TABLE public.themes 
ADD COLUMN cover_image_url TEXT;

-- Update RLS policies to allow users to update their theme cover images
-- (policies should already exist for themes table)