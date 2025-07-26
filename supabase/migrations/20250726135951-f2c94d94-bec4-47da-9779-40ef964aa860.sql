-- Fix category naming inconsistency: Update 'OpenAI Agents Basics' to 'ai agents'
UPDATE public.social_media_posts 
SET category = 'ai agents' 
WHERE category = 'OpenAI Agents Basics';

-- Update any cached prompts that might reference the old category
UPDATE public.cached_prompts 
SET category = 'ai agents' 
WHERE category = 'OpenAI Agents Basics';