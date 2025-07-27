-- Add public read access policy for published company portfolios
CREATE POLICY "Public can view published company portfolios" 
ON public.company_portfolios 
FOR SELECT 
USING (status = 'published');

-- Ensure company_portfolios table has proper status handling
-- Update any portfolios without a status to 'published' for existing data
UPDATE public.company_portfolios 
SET status = 'published' 
WHERE status IS NULL OR status = '';