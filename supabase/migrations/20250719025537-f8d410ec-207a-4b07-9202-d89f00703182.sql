-- Create case studies table
CREATE TABLE public.case_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT NOT NULL,
  hero_image TEXT,
  hero_image_alt TEXT,
  role TEXT NOT NULL,
  role_details TEXT,
  timeline TEXT NOT NULL,
  timeline_details TEXT,
  tags TEXT[],
  problem_title TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  solution_title TEXT NOT NULL,
  outcomes_title TEXT NOT NULL,
  reflection_title TEXT NOT NULL,
  cta_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case study challenges table
CREATE TABLE public.case_study_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'problem' or 'need'
  title TEXT NOT NULL,
  items TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case study team members table
CREATE TABLE public.case_study_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  items TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case study process steps table
CREATE TABLE public.case_study_process_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  items TEXT[],
  quote_text TEXT,
  quote_author TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case study features table
CREATE TABLE public.case_study_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case study outcomes table
CREATE TABLE public.case_study_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  user_feedback_quote TEXT,
  user_feedback_author TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case study reflections table
CREATE TABLE public.case_study_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'success', 'challenge', 'learning'
  title TEXT NOT NULL,
  items TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case study visuals table
CREATE TABLE public.case_study_visuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  design_artifacts TEXT[] NOT NULL,
  process_documentation TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_visuals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for case_studies
CREATE POLICY "Users can view their own case studies"
ON public.case_studies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own case studies"
ON public.case_studies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own case studies"
ON public.case_studies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own case studies"
ON public.case_studies FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for related tables (using case study ownership)
CREATE POLICY "Users can view challenges for their case studies"
ON public.case_study_challenges FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_challenges.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can manage challenges for their case studies"
ON public.case_study_challenges FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_challenges.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can view team members for their case studies"
ON public.case_study_team_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_team_members.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can manage team members for their case studies"
ON public.case_study_team_members FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_team_members.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can view process steps for their case studies"
ON public.case_study_process_steps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_process_steps.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can manage process steps for their case studies"
ON public.case_study_process_steps FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_process_steps.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can view features for their case studies"
ON public.case_study_features FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_features.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can manage features for their case studies"
ON public.case_study_features FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_features.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can view outcomes for their case studies"
ON public.case_study_outcomes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_outcomes.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can manage outcomes for their case studies"
ON public.case_study_outcomes FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_outcomes.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can view reflections for their case studies"
ON public.case_study_reflections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_reflections.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can manage reflections for their case studies"
ON public.case_study_reflections FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_reflections.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can view visuals for their case studies"
ON public.case_study_visuals FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_visuals.case_study_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can manage visuals for their case studies"
ON public.case_study_visuals FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.case_studies 
  WHERE id = case_study_visuals.case_study_id 
  AND user_id = auth.uid()
));

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_case_studies_updated_at
BEFORE UPDATE ON public.case_studies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_case_studies_user_id ON public.case_studies(user_id);
CREATE INDEX idx_case_studies_slug ON public.case_studies(slug);
CREATE INDEX idx_case_study_challenges_case_study_id ON public.case_study_challenges(case_study_id);
CREATE INDEX idx_case_study_team_members_case_study_id ON public.case_study_team_members(case_study_id);
CREATE INDEX idx_case_study_process_steps_case_study_id ON public.case_study_process_steps(case_study_id);
CREATE INDEX idx_case_study_process_steps_order ON public.case_study_process_steps(case_study_id, step_order);
CREATE INDEX idx_case_study_features_case_study_id ON public.case_study_features(case_study_id);
CREATE INDEX idx_case_study_outcomes_case_study_id ON public.case_study_outcomes(case_study_id);
CREATE INDEX idx_case_study_reflections_case_study_id ON public.case_study_reflections(case_study_id);
CREATE INDEX idx_case_study_visuals_case_study_id ON public.case_study_visuals(case_study_id);