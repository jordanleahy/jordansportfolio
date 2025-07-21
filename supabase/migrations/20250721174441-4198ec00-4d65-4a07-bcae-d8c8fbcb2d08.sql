-- Add 'published' as a valid status for vendors
-- First, let's see what constraint exists on the status column
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_status_check;

-- Add a new check constraint that includes 'published'
ALTER TABLE vendors ADD CONSTRAINT vendors_status_check 
CHECK (status IN ('draft', 'pending_research', 'completed', 'published'));

-- Update RLS policy to allow public access to published vendors
DROP POLICY IF EXISTS "Public can view published vendors" ON vendors;
DROP POLICY IF EXISTS "Authenticated users can view published vendors" ON vendors;

CREATE POLICY "Public can view published vendors" 
ON vendors 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Authenticated users can view published vendors" 
ON vendors 
FOR SELECT 
TO authenticated
USING (status = 'published');