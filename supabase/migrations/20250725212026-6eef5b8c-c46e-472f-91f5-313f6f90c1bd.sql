-- Add system_prompts and supported_categories fields to openai_agents table
ALTER TABLE public.openai_agents 
ADD COLUMN IF NOT EXISTS system_prompts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS supported_categories TEXT[] DEFAULT '{}';

-- Create function to insert the blog visual prompt generator agent
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
      'Blog Visual Prompt Generator',
      'Generates AI image prompts for blog visuals across different categories (Healthcare, Contracts, Design). Dynamically selects appropriate system prompts based on the category passed in the request.',
      'gpt-4o-mini',
      'api_call',
      'Category and blog content (JSON)',
      'Generated image prompt (JSON)',
      'on-demand',
      'Content Marketing Team',
      'active',
      ARRAY['blog', 'content-generation', 'image-prompts', 'ai-writing', 'visual-content'],
      'Multi-category blog visual prompt generator with healthcare, contracts, and design system prompts.',
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
$function$;