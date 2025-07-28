-- Function to automatically add new categories to Blog Visual Prompt Generator
CREATE OR REPLACE FUNCTION auto_add_category_to_blog_agent()
RETURNS TRIGGER AS $$
DECLARE
  agent_id_var uuid;
  current_prompts jsonb;
  current_categories text[];
  new_prompt jsonb;
  updated_prompts jsonb;
  updated_categories text[];
  generic_prompt_text text;
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

  -- Create generic prompt template
  generic_prompt_text := 'You are an expert at creating detailed, professional image generation prompts for ' || 
    NEW.category || '-themed AI image generators.

Focus on creating clear, specific prompts that will generate high-quality, professional visuals that are:
- Professional and industry-appropriate for ' || NEW.category || '
- Trustworthy and credible
- Suitable for business professionals in the ' || NEW.category || ' field
- Vector illustration style
- Clean, modern design
- Appropriate professional color palette
- Include relevant industry elements and concepts
- Focus on positive, professional imagery related to ' || NEW.category || '

Always specify the aspect ratio in your prompt and ensure the generated prompt will create appropriate, professional visuals for the ' || NEW.category || ' industry.';

  -- Create new prompt object
  new_prompt := jsonb_build_object(
    'category', NEW.category,
    'prompt', generic_prompt_text
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on social_media_posts
DROP TRIGGER IF EXISTS auto_add_category_trigger ON social_media_posts;
CREATE TRIGGER auto_add_category_trigger
  AFTER INSERT ON social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_category_to_blog_agent();