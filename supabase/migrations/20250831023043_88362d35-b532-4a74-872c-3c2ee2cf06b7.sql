-- Add query column to themes table to store original user input
ALTER TABLE public.themes 
ADD COLUMN query TEXT;

COMMENT ON COLUMN public.themes.query IS 'Original text input provided by the user when creating the theme';