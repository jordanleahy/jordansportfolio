
-- Create investors table
CREATE TABLE public.investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  sector_focus TEXT[] NOT NULL DEFAULT '{}',
  stage TEXT,
  check_size_min NUMERIC,
  check_size_max NUMERIC,
  latest_fund_name TEXT,
  latest_fund_year INTEGER,
  latest_fund_size NUMERIC,
  total_aum NUMERIC,
  lead_partner TEXT,
  contact_email TEXT,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own investors" 
ON public.investors 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view published investors" 
ON public.investors 
FOR SELECT 
TO anon 
USING (status = 'published');

CREATE POLICY "Authenticated users can view published investors" 
ON public.investors 
FOR SELECT 
TO authenticated 
USING (status = 'published');

CREATE POLICY "Users can create their own investors" 
ON public.investors 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investors" 
ON public.investors 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investors" 
ON public.investors 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_investors_updated_at
BEFORE UPDATE ON public.investors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_investors_slug ON public.investors(slug);
CREATE INDEX idx_investors_user_id ON public.investors(user_id);
CREATE INDEX idx_investors_status ON public.investors(status);
CREATE INDEX idx_investors_firm_name ON public.investors(firm_name);
CREATE INDEX idx_investors_sector_focus ON public.investors USING GIN(sector_focus);

-- Add constraint for status values
ALTER TABLE public.investors 
ADD CONSTRAINT investors_status_check 
CHECK (status IN ('draft', 'pending_research', 'completed', 'published'));
