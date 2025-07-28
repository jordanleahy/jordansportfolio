-- Update RLS policy to allow anonymous users to view completed and published portfolios
DROP POLICY IF EXISTS "Public can view published company portfolios" ON company_portfolios;

CREATE POLICY "Public can view completed and published company portfolios" 
ON company_portfolios 
FOR SELECT 
USING (status IN ('published', 'completed'));