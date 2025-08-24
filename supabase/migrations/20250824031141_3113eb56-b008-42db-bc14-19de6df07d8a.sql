-- Fix insert_posts_for_theme function to remove reference to non-existent theme_image_generation_status column
CREATE OR REPLACE FUNCTION insert_posts_for_theme(
  theme_id UUID,
  posts_data JSONB,
  theme_description_param TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  post_record JSONB;
  inserted_count INTEGER := 0;
BEGIN
  -- Loop through each post in the posts_data array
  FOR post_record IN SELECT * FROM jsonb_array_elements(posts_data)
  LOOP
    INSERT INTO social_media_posts (
      user_id,
      theme_id,
      day,
      title,
      story_description,
      status,
      theme_description
    )
    SELECT 
      t.user_id,
      theme_id,
      COALESCE((post_record->>'day')::INTEGER, 1),
      COALESCE(post_record->>'title', 'Untitled Post'),
      COALESCE(post_record->>'story_description', post_record->>'description', 'No description provided'),
      COALESCE(post_record->>'status', 'draft'),
      theme_description_param
    FROM themes t 
    WHERE t.id = theme_id;
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;