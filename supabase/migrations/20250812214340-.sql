-- Update the "Discover StoryShip" theme with proper educational content description
UPDATE themes 
SET 
  description = 'Established in 2010, this Scandinavian-inspired program blends Reggio-Emilia principles with child-led, project-based learning to honor each child''s interests and voice. The approach centers on curiosity, play, and children''s rights, creating an environment that values agency and deep exploration.',
  updated_at = now()
WHERE theme_name = 'Discover StoryShip';