
-- Drop existing public SELECT policies for vendors
DROP POLICY IF EXISTS "Anonymous users can view all vendors" ON vendors;
DROP POLICY IF EXISTS "Authenticated users can view all vendors" ON vendors;

-- Create new private SELECT policy - users can only view their own vendors
CREATE POLICY "Users can view only their own vendors" 
ON vendors 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
