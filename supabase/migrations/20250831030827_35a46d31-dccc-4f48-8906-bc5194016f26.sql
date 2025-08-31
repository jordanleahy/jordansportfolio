-- Fix system prompt agent_name values to use target agents instead of "System Prompt Generator"
-- This updates existing system prompts to have the correct agent_name based on their category

-- Update system prompts based on category routing logic
UPDATE public.system_prompts 
SET agent_name = CASE 
    -- Extract category from theme or use theme directly for routing
    WHEN LOWER(COALESCE(
        -- Try to extract category from theme context first
        CASE 
            WHEN theme ILIKE '%diabetes%' OR description ILIKE '%diabetes%' THEN 'what-is-diabetes'
            WHEN theme ILIKE '%cdi%' OR description ILIKE '%cdi%' OR theme ILIKE '%clinical documentation%' THEN 'cdi'
            WHEN theme ILIKE '%contract%' OR description ILIKE '%contract%' THEN 'contracts'
            WHEN theme ILIKE '%healthcare%' OR description ILIKE '%healthcare%' THEN 'healthcare'
            WHEN theme ILIKE '%finance%' OR description ILIKE '%finance%' THEN 'finance'
            WHEN theme ILIKE '%marketing%' OR description ILIKE '%marketing%' THEN 'marketing'
            WHEN theme ILIKE '%technology%' OR description ILIKE '%technology%' THEN 'technology'
            WHEN theme ILIKE '%education%' OR description ILIKE '%education%' THEN 'education'
            WHEN theme ILIKE '%hr%' OR theme ILIKE '%human resource%' OR description ILIKE '%hr%' THEN 'hr'
            WHEN theme ILIKE '%sales%' OR description ILIKE '%sales%' THEN 'sales'
            WHEN theme ILIKE '%operations%' OR description ILIKE '%operations%' THEN 'operations'
            WHEN theme ILIKE '%consulting%' OR description ILIKE '%consulting%' THEN 'consulting'
            WHEN theme ILIKE '%design%' OR description ILIKE '%design%' THEN 'design'
            WHEN theme ILIKE '%product%' OR description ILIKE '%product%' THEN 'product'
            WHEN theme ILIKE '%blog%' OR description ILIKE '%blog%' THEN 'blog'
            WHEN theme ILIKE '%cover letter%' OR description ILIKE '%cover letter%' THEN 'cover-letter'
            ELSE 'general'
        END, 'general')) = 'what-is-diabetes' THEN 'Visual Prompt Generator'
    WHEN LOWER(COALESCE(
        CASE 
            WHEN theme ILIKE '%diabetes%' OR description ILIKE '%diabetes%' THEN 'what-is-diabetes'
            WHEN theme ILIKE '%cdi%' OR description ILIKE '%cdi%' OR theme ILIKE '%clinical documentation%' THEN 'cdi'
            WHEN theme ILIKE '%contract%' OR description ILIKE '%contract%' THEN 'contracts'
            WHEN theme ILIKE '%healthcare%' OR description ILIKE '%healthcare%' THEN 'healthcare'
            WHEN theme ILIKE '%finance%' OR description ILIKE '%finance%' THEN 'finance'
            WHEN theme ILIKE '%marketing%' OR description ILIKE '%marketing%' THEN 'marketing'
            WHEN theme ILIKE '%technology%' OR description ILIKE '%technology%' THEN 'technology'
            WHEN theme ILIKE '%education%' OR description ILIKE '%education%' THEN 'education'
            WHEN theme ILIKE '%hr%' OR theme ILIKE '%human resource%' OR description ILIKE '%hr%' THEN 'hr'
            WHEN theme ILIKE '%sales%' OR description ILIKE '%sales%' THEN 'sales'
            WHEN theme ILIKE '%operations%' OR description ILIKE '%operations%' THEN 'operations'
            WHEN theme ILIKE '%consulting%' OR description ILIKE '%consulting%' THEN 'consulting'
            WHEN theme ILIKE '%design%' OR description ILIKE '%design%' THEN 'design'
            WHEN theme ILIKE '%product%' OR description ILIKE '%product%' THEN 'product'
            WHEN theme ILIKE '%blog%' OR description ILIKE '%blog%' THEN 'blog'
            WHEN theme ILIKE '%cover letter%' OR description ILIKE '%cover letter%' THEN 'cover-letter'
            ELSE 'general'
        END, 'general')) = 'cdi' THEN 'Visual Prompt Generator'
    WHEN LOWER(COALESCE(
        CASE 
            WHEN theme ILIKE '%diabetes%' OR description ILIKE '%diabetes%' THEN 'what-is-diabetes'
            WHEN theme ILIKE '%cdi%' OR description ILIKE '%cdi%' OR theme ILIKE '%clinical documentation%' THEN 'cdi'
            WHEN theme ILIKE '%contract%' OR description ILIKE '%contract%' THEN 'contracts'
            WHEN theme ILIKE '%healthcare%' OR description ILIKE '%healthcare%' THEN 'healthcare'
            WHEN theme ILIKE '%finance%' OR description ILIKE '%finance%' THEN 'finance'
            WHEN theme ILIKE '%marketing%' OR description ILIKE '%marketing%' THEN 'marketing'
            WHEN theme ILIKE '%technology%' OR description ILIKE '%technology%' THEN 'technology'
            WHEN theme ILIKE '%education%' OR description ILIKE '%education%' THEN 'education'
            WHEN theme ILIKE '%hr%' OR theme ILIKE '%human resource%' OR description ILIKE '%hr%' THEN 'hr'
            WHEN theme ILIKE '%sales%' OR description ILIKE '%sales%' THEN 'sales'
            WHEN theme ILIKE '%operations%' OR description ILIKE '%operations%' THEN 'operations'
            WHEN theme ILIKE '%consulting%' OR description ILIKE '%consulting%' THEN 'consulting'
            WHEN theme ILIKE '%design%' OR description ILIKE '%design%' THEN 'design'
            WHEN theme ILIKE '%product%' OR description ILIKE '%product%' THEN 'product'
            WHEN theme ILIKE '%blog%' OR description ILIKE '%blog%' THEN 'blog'
            WHEN theme ILIKE '%cover letter%' OR description ILIKE '%cover letter%' THEN 'cover-letter'
            ELSE 'general'
        END, 'general')) = 'blog' THEN 'Blog Content Generator'
    WHEN LOWER(COALESCE(
        CASE 
            WHEN theme ILIKE '%diabetes%' OR description ILIKE '%diabetes%' THEN 'what-is-diabetes'
            WHEN theme ILIKE '%cdi%' OR description ILIKE '%cdi%' OR theme ILIKE '%clinical documentation%' THEN 'cdi'
            WHEN theme ILIKE '%contract%' OR description ILIKE '%contract%' THEN 'contracts'
            WHEN theme ILIKE '%healthcare%' OR description ILIKE '%healthcare%' THEN 'healthcare'
            WHEN theme ILIKE '%finance%' OR description ILIKE '%finance%' THEN 'finance'
            WHEN theme ILIKE '%marketing%' OR description ILIKE '%marketing%' THEN 'marketing'
            WHEN theme ILIKE '%technology%' OR description ILIKE '%technology%' THEN 'technology'
            WHEN theme ILIKE '%education%' OR description ILIKE '%education%' THEN 'education'
            WHEN theme ILIKE '%hr%' OR theme ILIKE '%human resource%' OR description ILIKE '%hr%' THEN 'hr'
            WHEN theme ILIKE '%sales%' OR description ILIKE '%sales%' THEN 'sales'
            WHEN theme ILIKE '%operations%' OR description ILIKE '%operations%' THEN 'operations'
            WHEN theme ILIKE '%consulting%' OR description ILIKE '%consulting%' THEN 'consulting'
            WHEN theme ILIKE '%design%' OR description ILIKE '%design%' THEN 'design'
            WHEN theme ILIKE '%product%' OR description ILIKE '%product%' THEN 'product'
            WHEN theme ILIKE '%blog%' OR description ILIKE '%blog%' THEN 'blog'
            WHEN theme ILIKE '%cover letter%' OR description ILIKE '%cover letter%' THEN 'cover-letter'
            ELSE 'general'
        END, 'general')) = 'cover-letter' THEN 'Cover Letter Generator'
    -- Default to Visual Prompt Generator for all other categories
    ELSE 'Visual Prompt Generator'
END,
updated_at = now()
WHERE agent_name = 'System Prompt Generator';