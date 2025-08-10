-- Update all Visual Prompt Generator system prompts to use 20% safe space margins
-- This replaces all instances of safe zone specifications with a standardized 60% central frame (20% margin on each edge)

UPDATE system_prompts 
SET prompt_text = REPLACE(
    REPLACE(
        REPLACE(
            prompt_text,
            'central 80% of frame (10% margin on each edge)',
            'central 60% of frame (20% margin on each edge)'
        ),
        'within central 70–80% of the frame',
        'within central 60% of the frame'
    ),
    'central 70–80%',
    'central 60%'
)
WHERE agent_id IN (
    SELECT id FROM openai_agents 
    WHERE name = 'Blog Visual Prompt Generator'
)
AND (
    prompt_text LIKE '%central 80% of frame%' 
    OR prompt_text LIKE '%central 70–80%'
    OR prompt_text LIKE '%10% margin on each edge%'
);