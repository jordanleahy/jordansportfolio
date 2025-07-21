
-- Update RLS policies for vendors table to allow public access to published vendors
DROP POLICY IF EXISTS "Users can view only their own vendors" ON vendors;

-- Create new policies: users can view their own vendors, public can view published vendors
CREATE POLICY "Users can view their own vendors" 
ON vendors 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view published vendors"
ON vendors
FOR SELECT
TO anon
USING (status = 'published');

-- Also allow authenticated users to view published vendors
CREATE POLICY "Authenticated users can view published vendors"
ON vendors
FOR SELECT
TO authenticated
USING (status = 'published');
