-- Add public_access_type column to shared_collections table
ALTER TABLE public.shared_collections 
ADD COLUMN public_access_type TEXT DEFAULT 'blurred' CHECK (public_access_type IN ('blurred', 'full_public'));

-- Add comment to describe the column
COMMENT ON COLUMN public.shared_collections.public_access_type IS 'Determines public access level: blurred (first 3 images visible) or full_public (all images visible without auth)';

-- Update existing records to have the default 'blurred' type
UPDATE public.shared_collections 
SET public_access_type = 'blurred' 
WHERE public_access_type IS NULL;