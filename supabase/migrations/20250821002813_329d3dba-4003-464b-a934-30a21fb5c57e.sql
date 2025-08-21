-- Create enum for use case complexity
CREATE TYPE use_case_complexity AS ENUM ('simple', 'medium', 'complex');

-- Create enum for use case status  
CREATE TYPE use_case_status AS ENUM ('draft', 'published', 'archived');

-- Create use_cases table
CREATE TABLE public.use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  industry TEXT,
  complexity use_case_complexity DEFAULT 'medium',
  target_audience TEXT,
  business_value TEXT,
  technical_requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status use_case_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all use cases" 
ON public.use_cases 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view published use cases" 
ON public.use_cases 
FOR SELECT 
USING (status = 'published' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view published use cases"
ON public.use_cases
FOR SELECT
USING (status = 'published');

-- Create update trigger
CREATE OR REPLACE FUNCTION update_use_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_use_cases_updated_at
  BEFORE UPDATE ON public.use_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_use_cases_updated_at();

-- Create insert trigger to set created_by
CREATE OR REPLACE FUNCTION set_use_case_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_use_case_created_by
  BEFORE INSERT ON public.use_cases
  FOR EACH ROW
  EXECUTE FUNCTION set_use_case_created_by();

-- Create indexes for better performance
CREATE INDEX idx_use_cases_status ON public.use_cases(status);
CREATE INDEX idx_use_cases_category ON public.use_cases(category);
CREATE INDEX idx_use_cases_industry ON public.use_cases(industry);
CREATE INDEX idx_use_cases_tags ON public.use_cases USING GIN(tags);
CREATE INDEX idx_use_cases_created_at ON public.use_cases(created_at);
CREATE INDEX idx_use_cases_sort_order ON public.use_cases(sort_order);