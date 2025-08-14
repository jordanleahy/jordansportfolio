-- Create agent templates table for dynamic template management
CREATE TABLE public.agent_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  template_data JSONB NOT NULL, -- Contains CreateAgentData structure
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, category)
);

-- Create supported categories table
CREATE TABLE public.agent_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model options table
CREATE TABLE public.agent_model_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_value TEXT NOT NULL UNIQUE,
  model_label TEXT NOT NULL,
  description TEXT,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_model_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_templates
CREATE POLICY "Users can view system templates and their own" 
ON public.agent_templates FOR SELECT 
USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.agent_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.agent_templates FOR UPDATE 
USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete their own templates" 
ON public.agent_templates FOR DELETE 
USING (auth.uid() = user_id AND is_system = false);

-- RLS Policies for agent_categories (read-only for users)
CREATE POLICY "Anyone can view active categories" 
ON public.agent_categories FOR SELECT 
USING (is_active = true);

-- RLS Policies for agent_model_options (read-only for users)
CREATE POLICY "Anyone can view active model options" 
ON public.agent_model_options FOR SELECT 
USING (is_active = true);

-- Insert default categories
INSERT INTO public.agent_categories (category_key, display_name, description, sort_order) VALUES
('healthcare', 'Healthcare', 'Healthcare and medical industry specific agents', 1),
('contracts', 'Contracts', 'Legal contract analysis and management', 2),
('design', 'Design', 'UI/UX and visual design assistance', 3),
('coding_ai', 'Coding AI', 'Software development and programming support', 4),
('cdi', 'CDI', 'Clinical Documentation Improvement', 5),
('product_manager', 'Product Manager', 'Product management and strategy', 6),
('product_designer', 'Product Designer', 'Product design and user experience', 7),
('theme_structuring', 'Theme Structuring', 'Content theme organization and structuring', 8),
('vendor_analysis', 'Vendor Analysis', 'Competitive intelligence and vendor research', 9),
('input_triage', 'Input Triage', 'Request routing and classification', 10),
('linkedin', 'LinkedIn', 'LinkedIn content generation', 11),
('instagram', 'Instagram', 'Instagram content generation', 12),
('twitter_x', 'Twitter/X', 'Twitter/X content generation', 13),
('childrens_story', 'Children''s Story', 'Children''s story narration', 14),
('convincing_story', 'Convincing Story', 'Business presentation storytelling', 15);

-- Insert default model options
INSERT INTO public.agent_model_options (model_value, model_label, description, is_recommended, sort_order) VALUES
('gpt-5-mini', 'GPT-5 Mini', 'Fast and efficient for most tasks', true, 1),
('gpt-5-2025-08-07', 'GPT-5', 'Most capable flagship model', false, 2),
('gpt-4.1-2025-04-14', 'GPT-4.1', 'Reliable and powerful', false, 3),
('gpt-4.1-mini-2025-04-14', 'GPT-4.1 Mini', 'Efficient with vision capabilities', false, 4),
('o3-2025-04-16', 'O3', 'Advanced reasoning for complex problems', false, 5),
('o4-mini-2025-04-16', 'O4 Mini', 'Fast reasoning for coding and visual tasks', false, 6),
('gpt-4o', 'GPT-4o (Legacy)', 'Legacy model with vision', false, 7),
('gpt-4o-mini', 'GPT-4o Mini (Legacy)', 'Legacy fast model with vision', false, 8);

-- Insert system templates from the existing hardcoded ones
INSERT INTO public.agent_templates (user_id, name, description, category, template_data, is_system) VALUES
-- Use a system user ID (we'll use the first user for now, or create a system user)
((SELECT auth.uid() LIMIT 1), 'Visual Prompt Generator', 'Single source of truth for all visual prompt generation across categories', 'visual-prompts', '{
  "name": "Visual Prompt Generator",
  "purpose": "Single source of truth for all visual prompt generation. Stores and uses system prompts for different categories to generate AI image prompts. Categories are managed by the System Prompt Generator.",
  "model_version": "gpt-5-mini",
  "trigger": "api_call",
  "input_source": "Category and content (JSON)",
  "output_target": "Generated image prompt (JSON)",
  "schedule": "on-demand",
  "owner": "Content Marketing Team",
  "status": "active",
  "tags": ["visual-prompts", "image-generation", "multi-category", "ai-prompts"],
  "notes": "Centralized visual prompt generator. System prompts are managed by System Prompt Generator and stored here for actual image prompt generation.",
  "supported_categories": ["healthcare", "contracts", "design", "coding_ai", "cdi"]
}', true),

((SELECT auth.uid() LIMIT 1), 'Cover Letter Generator', 'Specialized agent for Product Manager and Product Designer cover letters', 'career', '{
  "name": "Cover Letter Generator",
  "purpose": "Generates personalized cover letters for Product Manager and Product Designer roles by analyzing job descriptions and incorporating user''s resume and case studies",
  "model_version": "gpt-5-mini",
  "trigger": "api_call",
  "input_source": "Job description, company info, user resume, case studies (JSON)",
  "output_target": "Structured cover letter (JSON)",
  "schedule": "on-demand",
  "owner": "Career Development Team",
  "status": "active",
  "tags": ["cover-letter", "job-application", "product-manager", "product-designer", "career"],
  "notes": "Specialized agent for generating tailored cover letters that leverage healthcare/technical background for PM and design roles.",
  "supported_categories": ["product_manager", "product_designer"]
}', true),

((SELECT auth.uid() LIMIT 1), 'Theme Structuring Agent', 'Converts free text into validated ThemeImportData JSON', 'content', '{
  "name": "Theme Structuring Agent",
  "purpose": "Structures free text into strict ThemeImportData JSON (category, theme, theme_description, posts[]) with length and status validation.",
  "model_version": "gpt-5-mini",
  "trigger": "api_call",
  "input_source": "Free text or loosely formatted JSON",
  "output_target": "Strict ThemeImportData JSON",
  "schedule": "on-demand",
  "owner": "Content Ops",
  "status": "active",
  "tags": ["theme-structuring", "json", "validation", "import"],
  "notes": "Pre-processes user input before import; mirrors structure-theme-input behavior. Use to ensure compliant data before import.",
  "supported_categories": ["theme_structuring"],
  "temperature": 0.2,
  "max_tokens": 2000
}', true);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_agent_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_agent_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_agent_model_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_templates_updated_at
  BEFORE UPDATE ON public.agent_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_templates_updated_at();

CREATE TRIGGER update_agent_categories_updated_at
  BEFORE UPDATE ON public.agent_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_categories_updated_at();

CREATE TRIGGER update_agent_model_options_updated_at
  BEFORE UPDATE ON public.agent_model_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_model_options_updated_at();

-- Add to realtime publication
ALTER TABLE public.agent_templates REPLICA IDENTITY FULL;
ALTER TABLE public.agent_categories REPLICA IDENTITY FULL;
ALTER TABLE public.agent_model_options REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_model_options;