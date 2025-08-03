UPDATE openai_agents 
SET 
  input_source = 'Blog post or social media content with structured category information (JSON): Accepts title, description, category (healthcare/contracts/design/etc.), optional color theme preferences, and content context. The system analyzes industry-specific terminology, professional audience needs, and visual requirements to determine the most appropriate prompt generation approach.',
  output_target = 'Professional AI image generation prompt (JSON): Returns a comprehensive, detailed prompt optimized for DALL-E or similar AI image generators. Includes specific visual composition instructions, professional color palettes, industry-appropriate metaphors, style guidelines (vector illustration/business professional), aspect ratio specifications, and accessibility considerations tailored to the content category.',
  updated_at = now()
WHERE name = 'Visual Prompt Generator'