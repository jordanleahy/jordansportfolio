-- Enhance characters table for character creation system
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS seed TEXT,
ADD COLUMN IF NOT EXISTS character_type TEXT DEFAULT 'pixar' CHECK (character_type IN ('pixar', 'vector', 'realistic')),
ADD COLUMN IF NOT EXISTS style_prompt TEXT,
ADD COLUMN IF NOT EXISTS original_photo_hash TEXT;

-- Update character_generations table to better support character management
ALTER TABLE public.character_generations 
ADD COLUMN IF NOT EXISTS seed TEXT,
ADD COLUMN IF NOT EXISTS character_type TEXT DEFAULT 'pixar' CHECK (character_type IN ('pixar', 'vector', 'realistic'));

-- Create index for better performance on character lookups
CREATE INDEX IF NOT EXISTS idx_characters_user_type ON public.characters(user_id, character_type);
CREATE INDEX IF NOT EXISTS idx_characters_hash ON public.characters(original_photo_hash);
CREATE INDEX IF NOT EXISTS idx_character_generations_character_id ON public.character_generations(character_id);

-- Update character_generations foreign key relationship
ALTER TABLE public.character_generations 
DROP CONSTRAINT IF EXISTS character_generations_character_id_fkey,
ADD CONSTRAINT character_generations_character_id_fkey 
FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;