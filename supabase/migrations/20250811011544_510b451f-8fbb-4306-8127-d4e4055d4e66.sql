-- 1) Add a safe mapping from themes -> system_prompts and backfill the provided IDs
-- This migration is additive and reversible (column is nullable; FK ON DELETE SET NULL)

-- Add column to themes table (if not exists pattern via DO block to avoid failure if re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'themes' AND column_name = 'visual_prompt_system_prompt_id'
  ) THEN
    ALTER TABLE public.themes 
      ADD COLUMN visual_prompt_system_prompt_id uuid NULL;
  END IF;
END $$;

-- Add FK constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'themes_visual_prompt_system_prompt_id_fkey'
  ) THEN
    ALTER TABLE public.themes
      ADD CONSTRAINT themes_visual_prompt_system_prompt_id_fkey
      FOREIGN KEY (visual_prompt_system_prompt_id)
      REFERENCES public.system_prompts(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add index if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_themes_visual_prompt_system_prompt_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_themes_visual_prompt_system_prompt_id
    ON public.themes (visual_prompt_system_prompt_id);
  END IF;
END $$;

-- 2) Backfill mapping for the requested theme and system prompt
-- Theme ID: 6444523c-dbf4-46c5-b766-73a1163293bd
-- System Prompt ID: 58fa518d-9715-40da-827d-6473ce8e5e52
UPDATE public.themes
SET visual_prompt_system_prompt_id = '58fa518d-9715-40da-827d-6473ce8e5e52'
WHERE id = '6444523c-dbf4-46c5-b766-73a1163293bd';