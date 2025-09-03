-- Update existing full_public collections to blurred for consistent user experience
-- This ensures all shared collections maintain authentication gates for lead generation

UPDATE shared_collections 
SET public_access_type = 'blurred'
WHERE public_access_type = 'full_public';

-- Log the number of affected collections for tracking
-- (This will be visible in the migration output)