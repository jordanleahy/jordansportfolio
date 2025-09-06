-- Update the system prompt template to minimize text in generated images
UPDATE theme_system_prompts 
SET prompt_text = REPLACE(
  prompt_text, 
  '- Use simple text overlays to explain relevent informatio',
  '- CRITICAL: Limit text to maximum 5 words total (titles/labels only)
- Focus on visual storytelling without explanatory text overlays
- Generate clean, minimal visuals that communicate through imagery alone'
),
updated_at = now()
WHERE id = '3eb7166e-b7e0-4fae-976d-9f6e98f24480';