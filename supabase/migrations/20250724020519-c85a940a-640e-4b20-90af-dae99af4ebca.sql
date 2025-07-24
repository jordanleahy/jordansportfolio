-- Create comparisons table for dynamic comparison management
CREATE TABLE public.comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  company1_data JSONB NOT NULL,
  company2_data JSONB NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  use_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view published comparisons"
ON public.comparisons
FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can manage all comparisons"
ON public.comparisons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_comparisons_updated_at
BEFORE UPDATE ON public.comparisons
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_comparisons_slug ON public.comparisons(slug);
CREATE INDEX idx_comparisons_status ON public.comparisons(status);
CREATE INDEX idx_comparisons_created_by ON public.comparisons(created_by);