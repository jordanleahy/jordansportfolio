-- Add columns for image generation prompt and status tracking
ALTER TABLE public.street_vision_generations
ADD COLUMN IF NOT EXISTS image_generation_prompt text,
ADD COLUMN IF NOT EXISTS prompt_creation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS prompt_created_at timestamp with time zone;

-- Add index for prompt creation status for better query performance
CREATE INDEX IF NOT EXISTS idx_street_vision_generations_prompt_status 
ON public.street_vision_generations(prompt_creation_status);

-- Add check constraint for valid prompt creation statuses
ALTER TABLE public.street_vision_generations 
ADD CONSTRAINT check_prompt_creation_status 
CHECK (prompt_creation_status IN ('pending', 'created', 'failed'));