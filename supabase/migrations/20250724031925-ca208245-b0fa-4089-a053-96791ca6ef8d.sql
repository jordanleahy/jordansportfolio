-- Create normalized tables for comparison data

-- Companies in comparisons (normalized company data)
CREATE TABLE public.comparison_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comparison_id uuid NOT NULL REFERENCES public.comparisons(id) ON DELETE CASCADE,
  company_position integer NOT NULL CHECK (company_position IN (1, 2)),
  vendor_id uuid REFERENCES public.vendors(id),
  name text NOT NULL,
  founded text,
  headquarters text,
  key_benefits text[],
  unique_strengths text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comparison_id, company_position)
);

-- Basic information rows
CREATE TABLE public.comparison_basic_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comparison_id uuid NOT NULL REFERENCES public.comparisons(id) ON DELETE CASCADE,
  category text NOT NULL,
  company1_value text NOT NULL,
  company2_value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Feature comparison rows
CREATE TABLE public.comparison_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comparison_id uuid NOT NULL REFERENCES public.comparisons(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  company1_value text NOT NULL,
  company2_value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Use case rows
CREATE TABLE public.comparison_use_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comparison_id uuid NOT NULL REFERENCES public.comparisons(id) ON DELETE CASCADE,
  use_case text NOT NULL,
  best_fit text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Summary insights (one row per company per comparison)
CREATE TABLE public.comparison_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comparison_id uuid NOT NULL REFERENCES public.comparisons(id) ON DELETE CASCADE,
  company_position integer NOT NULL CHECK (company_position IN (1, 2)),
  insight_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comparison_id, company_position)
);

-- Enable RLS on all new tables
ALTER TABLE public.comparison_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comparison tables
-- Admins can manage all comparison data
CREATE POLICY "Admins can manage all comparison companies" ON public.comparison_companies FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all comparison basic info" ON public.comparison_basic_info FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all comparison features" ON public.comparison_features FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all comparison use cases" ON public.comparison_use_cases FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all comparison insights" ON public.comparison_insights FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view data for published comparisons
CREATE POLICY "Public can view companies for published comparisons" ON public.comparison_companies 
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.comparisons 
  WHERE comparisons.id = comparison_companies.comparison_id 
  AND comparisons.status = 'published'
));

CREATE POLICY "Public can view basic info for published comparisons" ON public.comparison_basic_info 
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.comparisons 
  WHERE comparisons.id = comparison_basic_info.comparison_id 
  AND comparisons.status = 'published'
));

CREATE POLICY "Public can view features for published comparisons" ON public.comparison_features 
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.comparisons 
  WHERE comparisons.id = comparison_features.comparison_id 
  AND comparisons.status = 'published'
));

CREATE POLICY "Public can view use cases for published comparisons" ON public.comparison_use_cases 
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.comparisons 
  WHERE comparisons.id = comparison_use_cases.comparison_id 
  AND comparisons.status = 'published'
));

CREATE POLICY "Public can view insights for published comparisons" ON public.comparison_insights 
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.comparisons 
  WHERE comparisons.id = comparison_insights.comparison_id 
  AND comparisons.status = 'published'
));

-- Add indexes for performance
CREATE INDEX idx_comparison_companies_comparison_id ON public.comparison_companies(comparison_id);
CREATE INDEX idx_comparison_basic_info_comparison_id ON public.comparison_basic_info(comparison_id);
CREATE INDEX idx_comparison_features_comparison_id ON public.comparison_features(comparison_id);
CREATE INDEX idx_comparison_use_cases_comparison_id ON public.comparison_use_cases(comparison_id);
CREATE INDEX idx_comparison_insights_comparison_id ON public.comparison_insights(comparison_id);