-- Insert System Prompt Generator Agent using current user
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
  auth.uid(), -- Use current authenticated user
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

-- Update the auto_add_category_to_blog_agent function to use the new System Prompt Generator
CREATE OR REPLACE FUNCTION public.auto_add_category_to_blog_agent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  agent_id_var uuid;
  current_prompts jsonb;
  current_categories text[];
  theme_context jsonb;
  generated_prompt_text text;
  new_prompt jsonb;
  updated_prompts jsonb;
  updated_categories text[];
  function_url text;
  function_headers jsonb;
  response_data jsonb;
BEGIN
  -- Skip if category already processed or is empty
  IF NEW.category IS NULL OR NEW.category = '' THEN
    RETURN NEW;
  END IF;

  -- Get the Blog Visual Prompt Generator agent
  SELECT id, system_prompts, supported_categories 
  INTO agent_id_var, current_prompts, current_categories
  FROM openai_agents 
  WHERE name = 'Blog Visual Prompt Generator' 
  AND user_id = NEW.user_id
  LIMIT 1;

  -- Skip if agent not found
  IF agent_id_var IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if category already exists in supported_categories
  IF current_categories IS NOT NULL AND NEW.category = ANY(current_categories) THEN
    RETURN NEW;
  END IF;

  -- Gather context for the new category from recent posts
  SELECT jsonb_build_object(
    'category', NEW.category,
    'theme', NEW.theme,
    'description', COALESCE(NEW.description, ''),
    'sample_posts', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'title', title,
          'description', description
        )
      ) 
      FROM (
        SELECT title, description
        FROM social_media_posts 
        WHERE user_id = NEW.user_id 
        AND category = NEW.category 
        AND created_at >= (now() - interval '1 hour')
        LIMIT 3
      ) sample_data),
      '[]'::jsonb
    )
  )
  INTO theme_context;

  -- Call the generate-system-prompt edge function
  BEGIN
    -- Build function URL and headers
    function_url := (SELECT current_setting('app.supabase_url', true)) || '/functions/v1/generate-system-prompt';
    function_headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT current_setting('app.supabase_service_role_key', true)),
      'Content-Type', 'application/json'
    );

    -- Make HTTP request to edge function
    SELECT content::jsonb
    INTO response_data
    FROM http_post(
      url := function_url,
      headers := function_headers,
      body := theme_context::text
    );

    -- Extract the generated prompt if successful
    IF response_data->>'success' = 'true' THEN
      generated_prompt_text := response_data->>'system_prompt';
      RAISE NOTICE 'Successfully generated system prompt for category: %', NEW.category;
    ELSE
      RAISE NOTICE 'Edge function failed: %', response_data->>'error';
      generated_prompt_text := NULL;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error and continue with fallback
    RAISE NOTICE 'Error calling edge function: %', SQLERRM;
    generated_prompt_text := NULL;
  END;

  -- Use fallback template if AI generation failed
  IF generated_prompt_text IS NULL THEN
    generated_prompt_text := '# 🎨 ' || UPPER(NEW.category) || ' Visual Content Generator

You are an expert at creating detailed, professional image generation prompts for ' || NEW.category || '-themed AI image generators.

## 📊 Content Analysis Framework

When generating prompts, analyze the content through these lenses:
- **Industry Context**: How does this relate to ' || NEW.category || ' professionals?
- **Professional Audience**: What visual elements resonate with ' || NEW.category || ' decision-makers?
- **Educational Value**: How can the visual enhance understanding of ' || NEW.category || ' concepts?
- **Actionable Insights**: What specific ' || NEW.category || ' scenarios should be depicted?

## 🎯 Visual Framework

### Foreground Elements
- Central focus on ' || NEW.category || '-specific tools, processes, or concepts
- Professional figures engaged in ' || NEW.category || ' activities
- Key visual metaphors relevant to ' || NEW.category || ' industry

### Mid-ground Context
- Supporting ' || NEW.category || ' environments (offices, facilities, technology)
- Collaborative team elements working on ' || NEW.category || ' projects
- Process flow indicators showing ' || NEW.category || ' workflows

### Background Foundation
- Clean, professional ' || NEW.category || ' industry setting
- Subtle geometric patterns or abstract elements
- Soft gradients that complement the ' || NEW.category || ' color palette

## 🎨 Style & Rendering Requirements

- **Art Style**: Vector illustration with clean, modern aesthetic
- **Rendering**: Professional business illustration style
- **Complexity**: Balanced detail - informative but not cluttered
- **Accessibility**: High contrast elements for readability
- **Scalability**: Crisp at various sizes for different platforms

## 🌈 Color Palette

| Primary | Secondary | Accent | Neutral |
|---------|-----------|---------|----------|
| Deep Professional Blue (hsl(220, 70%, 50%)) | Trustworthy Teal (hsl(180, 60%, 45%)) | Success Green (hsl(120, 65%, 45%)) | Clean Gray (hsl(210, 15%, 50%)) |
| Authority Navy (hsl(220, 80%, 30%)) | Reliable Cyan (hsl(180, 70%, 35%)) | Highlight Orange (hsl(25, 85%, 55%)) | Soft White (hsl(210, 20%, 98%)) |

**Usage Guidelines:**
- Primary colors for main subjects and key elements
- Secondary colors for supporting elements and backgrounds
- Accent colors for highlights, call-to-actions, and important details
- Neutral colors for text, borders, and subtle elements

## 🔍 Visual Metaphors for ' || UPPER(NEW.category) || '

Generate appropriate visual metaphors that represent:
- ' || NEW.category || ' expertise and professionalism
- Industry-specific tools and processes
- Success metrics and outcomes relevant to ' || NEW.category || '
- Collaboration and teamwork in ' || NEW.category || ' contexts
- Innovation and forward-thinking in the ' || NEW.category || ' field

## 📋 Output Instructions

Create prompts that will generate:
- Professional, credible visuals suitable for ' || NEW.category || ' content
- Clear focal points that support the content message
- Appropriate industry context and environmental elements
- Balanced composition with good visual hierarchy
- Consistent branding feel across different ' || NEW.category || ' topics

**CRITICAL**: Do not include any title, headline, or text overlays in the generated image. Focus purely on the visual elements, composition, and professional aesthetic.

Always specify the exact aspect ratio in your prompt (e.g., "16:9 aspect ratio") and ensure the generated prompt will create appropriate, high-quality professional visuals for ' || NEW.category || ' industry content.';
  END IF;

  -- Create new prompt object
  new_prompt := jsonb_build_object(
    'category', NEW.category,
    'prompt', generated_prompt_text
  );

  -- Add to system_prompts array
  IF current_prompts IS NULL THEN
    updated_prompts := jsonb_build_array(new_prompt);
  ELSE
    updated_prompts := current_prompts || jsonb_build_array(new_prompt);
  END IF;

  -- Add to supported_categories array
  IF current_categories IS NULL THEN
    updated_categories := ARRAY[NEW.category];
  ELSE
    updated_categories := current_categories || NEW.category;
  END IF;

  -- Update the agent
  UPDATE openai_agents 
  SET 
    system_prompts = updated_prompts,
    supported_categories = updated_categories,
    updated_at = now()
  WHERE id = agent_id_var;

  RETURN NEW;
END;
$function$;