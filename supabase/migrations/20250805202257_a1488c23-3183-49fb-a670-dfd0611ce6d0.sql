-- Drop existing foreign key constraint
ALTER TABLE social_media_posts DROP CONSTRAINT IF EXISTS social_media_posts_theme_id_fkey;

-- Recreate foreign key with CASCADE delete
ALTER TABLE social_media_posts 
ADD CONSTRAINT social_media_posts_theme_id_fkey 
FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE;