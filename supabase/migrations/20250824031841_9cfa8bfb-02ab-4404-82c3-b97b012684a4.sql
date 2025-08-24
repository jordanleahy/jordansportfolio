-- Fix insert_posts_for_theme function to use correct column names
CREATE OR REPLACE FUNCTION insert_posts_for_theme(
  theme_id UUID,
  posts_data JSONB,
  theme_description_param TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  post_record JSONB;
  inserted_count INTEGER := 0;
  theme_category TEXT;
BEGIN
  -- Get the category from the theme
  SELECT category INTO theme_category 
  FROM themes 
  WHERE id = theme_id;
  
  -- Default to 'general' if no category found
  theme_category := COALESCE(theme_category, 'general');
  
  -- Loop through each post in the posts_data array
  FOR post_record IN SELECT * FROM jsonb_array_elements(posts_data)
  LOOP
    INSERT INTO social_media_posts (
      user_id,
      theme_id,
      day,
      title,
      description,
      status,
      category
    )
    SELECT 
      t.user_id,
      theme_id,
      COALESCE((post_record->>'day')::INTEGER, 1),
      COALESCE(post_record->>'title', 'Untitled Post'),
      COALESCE(post_record->>'story_description', post_record->>'description', 'No description provided'),
      COALESCE(post_record->>'status', 'draft')::post_status,
      theme_category
    FROM themes t 
    WHERE t.id = theme_id;
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;