-- Rename "Blog Visual Prompt Generator" to "Visual Prompt Generator"
UPDATE public.openai_agents 
SET name = 'Visual Prompt Generator'
WHERE name = 'Blog Visual Prompt Generator';

-- Update any cached prompts that reference the old agent name
UPDATE public.cached_prompts 
SET metadata = jsonb_set(
  metadata, 
  '{agent}', 
  '"Visual Prompt Generator"'
)
WHERE metadata->>'agent' = 'Blog Visual Prompt Generator';

-- Update the trigger function to use the new agent name
CREATE OR REPLACE FUNCTION public.auto_add_category_to_blog_agent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  agent_id_var uuid;
  current_prompts jsonb;
  current_categories text[];
  new_prompt jsonb;
  updated_prompts jsonb;
  updated_categories text[];
  comprehensive_prompt_text text;
BEGIN
  -- Skip if category already processed or is empty
  IF NEW.category IS NULL OR NEW.category = '' THEN
    RETURN NEW;
  END IF;

  -- Get the Visual Prompt Generator agent (renamed from Blog Visual Prompt Generator)
  SELECT id, system_prompts, supported_categories 
  INTO agent_id_var, current_prompts, current_categories
  FROM openai_agents 
  WHERE name = 'Visual Prompt Generator' 
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

  -- Create comprehensive CDI-style prompt template
  comprehensive_prompt_text := '# 🎨 ' || UPPER(NEW.category) || ' Visual Content Generator

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
| Deep Professional Blue (#2563eb) | Trustworthy Teal (#0891b2) | Success Green (#16a34a) | Clean Gray (#64748b) |
| Authority Navy (#1e40af) | Reliable Cyan (#0e7490) | Highlight Orange (#ea580c) | Soft White (#f8fafc) |

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

  -- Create new prompt object
  new_prompt := jsonb_build_object(
    'category', NEW.category,
    'prompt', comprehensive_prompt_text
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
$function$

-- Update the function that creates the blog visual agent
CREATE OR REPLACE FUNCTION public.insert_blog_visual_agent()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only insert if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.openai_agents (
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
      supported_categories,
      user_id
    ) VALUES (
      'Visual Prompt Generator',
      'Generates AI image prompts for blog visuals across different categories (Healthcare, Contracts, Design). Dynamically selects appropriate system prompts based on the category passed in the request.',
      'gpt-4o-mini',
      'api_call',
      'Category and blog content (JSON)',
      'Generated image prompt (JSON)',
      'on-demand',
      'Content Marketing Team',
      'active',
      ARRAY['blog', 'content-generation', 'image-prompts', 'ai-writing', 'visual-content'],
      'Multi-category visual prompt generator with healthcare, contracts, and design system prompts.',
      '[
        {
          "category": "healthcare",
          "prompt": "You are an expert at creating detailed, professional image generation prompts for healthcare-themed AI image generators. \\n\\nFocus on creating clear, specific prompts that will generate high-quality, professional healthcare visuals that are:\\n- Medical and clinical in nature\\n- Professional and trustworthy\\n- Suitable for healthcare professionals\\n- Vector illustration style\\n- Clean, modern design\\n- Appropriate color palette (blues, greens, whites)\\n- Include relevant medical elements (stethoscopes, charts, technology)\\n- Avoid any graphic medical content\\n- Focus on positive, professional healthcare imagery\\n\\nAlways specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional healthcare visuals."
        },
        {
          "category": "contracts",
          "prompt": "You are an expert at creating detailed, professional image generation prompts for business and contract-themed AI image generators.\\n\\nFocus on creating clear, specific prompts that will generate high-quality, professional business visuals that are:\\n- Business and corporate in nature\\n- Professional and trustworthy\\n- Suitable for business professionals\\n- Vector illustration style\\n- Clean, modern design\\n- Appropriate color palette (blues, grays, whites, professional tones)\\n- Include relevant business elements (documents, handshakes, charts, technology)\\n- Focus on contract management, revenue cycle, and business processes\\n- Professional, clean imagery\\n\\nAlways specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional business visuals."
        },
        {
          "category": "design",
          "prompt": "You are an expert at creating detailed, professional image generation prompts for design-themed AI image generators.\\n\\nFocus on creating clear, specific prompts that will generate high-quality, professional design visuals that are:\\n- Creative and innovative in nature\\n- Professional and inspiring\\n- Suitable for design professionals\\n- Vector illustration style\\n- Clean, modern design\\n- Vibrant but professional color palette\\n- Include relevant design elements (tools, interfaces, creative processes)\\n- Focus on UI/UX, graphic design, and creative workflows\\n- Inspiring, creative imagery\\n\\nAlways specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional design visuals."
        }
      ]'::jsonb,
      ARRAY['healthcare', 'contracts', 'design'],
      auth.uid()
    )
    ON CONFLICT (user_id, name) DO NOTHING;
  END IF;
END;
$function$