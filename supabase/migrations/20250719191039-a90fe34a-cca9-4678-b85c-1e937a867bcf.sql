-- Update RLS policies for vendors table to allow all authenticated users to view
DROP POLICY IF EXISTS "Vendors are publicly viewable" ON vendors;

-- Allow authenticated users to view all vendors
CREATE POLICY "Authenticated users can view all vendors" 
ON vendors 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow anonymous users to view all vendors
CREATE POLICY "Anonymous users can view all vendors" 
ON vendors 
FOR SELECT 
TO anon 
USING (true);