-- Create a database function to atomically update prompt and status
CREATE OR REPLACE FUNCTION update_post_prompt_and_status(
  p_post_id UUID,
  p_generated_prompt TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update both fields atomically
  UPDATE social_media_posts 
  SET 
    generated_image_prompt = p_generated_prompt,
    individual_prompt_status = 'completed',
    updated_at = now()
  WHERE id = p_post_id;
  
  -- Return true if exactly one row was updated
  RETURN FOUND;
END;
$$;