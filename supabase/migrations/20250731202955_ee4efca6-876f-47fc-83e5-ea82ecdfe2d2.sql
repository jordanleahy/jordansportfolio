-- Insert System Prompt Generator Agent using existing user ID
INSERT INTO public.openai_agents (
  user_id,
  name, 
  purpose, 
  model_version, 
  trigger, 
  input_source, 
  output_target, 
  schedule, 
  owner, 
  status, 
  tags, 
  notes,
  system_prompts,
  supported_categories
) VALUES (
  '3e7858df-9613-4285-98d2-ffb818c26f6d', -- Use existing user ID
  'System Prompt Generator',
  'Analyzes theme context and generates comprehensive, industry-specific system prompts for visual content generators. Uses category, theme, description, and sample content to create detailed visual frameworks following the proven CDI template structure.',
  'gpt-4.1-2025-04-14',
  'api_call',
  'Theme context data (JSON): category, theme, description, sample posts',
  'Comprehensive system prompt with industry analysis and visual frameworks',
  'on-demand',
  'Content Intelligence Team',
  'active',
  ARRAY['system-prompt', 'content-generation', 'visual-prompts', 'ai-automation', 'theme-analysis'],
  'Master agent for generating contextual system prompts. Analyzes theme import data to create industry-specific visual content generation prompts with appropriate color palettes, visual frameworks, and professional formatting.',
  '[
    {
      "category": "system_prompt_generation",
      "prompt": "You are an expert system prompt architect specializing in creating comprehensive, industry-specific visual content generation prompts.\\n\\nYour expertise includes:\\n- Industry analysis and context understanding\\n- Visual content strategy and framework design\\n- Professional color palette development\\n- Content analysis and metaphor creation\\n- Structured prompt engineering\\n\\nWhen given category context (theme, description, sample content), you:\\n1. Analyze the industry and professional context\\n2. Identify key visual elements and terminology\\n3. Develop appropriate color palettes with HSL values\\n4. Create comprehensive visual frameworks\\n5. Structure output following the proven CDI template format\\n\\nYour generated system prompts enable high-quality, contextually-appropriate visual content that resonates with specific industry professionals and maintains consistent branding across different topics within each category."
    }
  ]'::jsonb,
  ARRAY['system_prompt_generation']
);