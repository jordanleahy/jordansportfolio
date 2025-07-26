-- Update system prompts to remove hardcoded aspect ratio instructions
-- This fixes the issue where prompts always contain "16:9 aspect ratio" instructions

UPDATE openai_agents 
SET system_prompts = jsonb_set(
  system_prompts,
  '{0,prompt}',
  to_jsonb(
    replace(
      replace(
        replace(
          (system_prompts->0->>'prompt'),
          'Always specify the aspect ratio in your prompt.',
          ''
        ),
        'Always include aspect ratio specifications.',
        ''
      ),
      'Make sure to specify the aspect ratio.',
      ''
    )
  )
)
WHERE name = 'Blog Visual Prompt Generator'
  AND system_prompts IS NOT NULL
  AND jsonb_array_length(system_prompts) > 0;