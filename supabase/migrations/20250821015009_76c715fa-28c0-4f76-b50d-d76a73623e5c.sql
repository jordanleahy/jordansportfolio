-- Transform use_cases table to comprehensive case study structure
-- Add hero section fields
ALTER TABLE public.use_cases 
ADD COLUMN IF NOT EXISTS hero_image text,
ADD COLUMN IF NOT EXISTS hero_image_alt text,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'UX Designer',
ADD COLUMN IF NOT EXISTS role_details text,
ADD COLUMN IF NOT EXISTS timeline_value text DEFAULT '6 months',
ADD COLUMN IF NOT EXISTS timeline_details text;

-- Add Figma integration fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS figma_presentation_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS figma_presentation_url text,
ADD COLUMN IF NOT EXISTS figma_presentation_title text;

-- Add final product fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS prototype_url text,
ADD COLUMN IF NOT EXISTS final_product_description text;

-- Add problem section fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS problem_title text DEFAULT 'The Challenge',
ADD COLUMN IF NOT EXISTS problem_description text,
ADD COLUMN IF NOT EXISTS challenges jsonb DEFAULT '[]'::jsonb;

-- Add team section fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS team_members jsonb DEFAULT '[]'::jsonb;

-- Add process section fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS process_title text DEFAULT 'Design Process',
ADD COLUMN IF NOT EXISTS process_steps jsonb DEFAULT '[]'::jsonb;

-- Add solution section fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS solution_title text DEFAULT 'Solution & Key Features',
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;

-- Add outcomes section fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS outcomes_title text DEFAULT 'Outcomes',
ADD COLUMN IF NOT EXISTS user_feedback jsonb;

-- Add reflection section fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS reflection_title text DEFAULT 'Reflection & Learnings',
ADD COLUMN IF NOT EXISTS reflections jsonb DEFAULT '[]'::jsonb;

-- Add visual assets fields
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS visual_artifacts jsonb DEFAULT '{"designArtifacts": [], "processDocumentation": []}'::jsonb;

-- Add CTA field
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS cta_title text DEFAULT 'Ready to discuss your project?';

-- Add slug for public URLs
ALTER TABLE public.use_cases
ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_use_cases_slug ON public.use_cases(slug) WHERE slug IS NOT NULL;