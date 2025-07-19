-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  headquarters TEXT NOT NULL,
  company_type TEXT NOT NULL,
  description TEXT NOT NULL,
  core_services TEXT[] NOT NULL DEFAULT '{}',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  customers TEXT[] NOT NULL DEFAULT '{}',
  founding_year INTEGER,
  funding_stage TEXT,
  total_funding TEXT,
  key_investors TEXT[] NOT NULL DEFAULT '{}',
  competitive_advantages TEXT[] NOT NULL DEFAULT '{}',
  key_features TEXT[] NOT NULL DEFAULT '{}',
  key_benefits TEXT[] NOT NULL DEFAULT '{}',
  performance_metrics JSONB,
  notable_customers TEXT[] NOT NULL DEFAULT '{}',
  website_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors are publicly viewable" 
ON public.vendors 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create vendors" 
ON public.vendors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors" 
ON public.vendors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors" 
ON public.vendors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for slug lookup
CREATE INDEX idx_vendors_slug ON public.vendors(slug);