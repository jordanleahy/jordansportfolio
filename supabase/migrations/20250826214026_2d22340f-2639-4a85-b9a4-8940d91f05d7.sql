-- Remove book research agent and related database artifacts
DELETE FROM openai_agents WHERE name = 'Book Research & Verification Agent';

-- Remove book highlights visual agent if it exists  
DELETE FROM openai_agents WHERE name = 'Book Highlights Visual Style Agent';

-- Drop the insert functions that are no longer needed
DROP FUNCTION IF EXISTS public.insert_book_research_agent();
DROP FUNCTION IF EXISTS public.insert_book_highlights_visual_agent();