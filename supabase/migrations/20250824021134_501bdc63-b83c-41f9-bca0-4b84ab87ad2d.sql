-- Add character reference fields to themes table
ALTER TABLE public.themes 
ADD COLUMN reference_character_id uuid REFERENCES public.characters(id),
ADD COLUMN reference_character_analysis jsonb,
ADD COLUMN has_character_reference boolean DEFAULT false;