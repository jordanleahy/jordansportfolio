-- Remove redundant aspect ratio instructions from Visual Prompt Generator system prompts
-- These are now handled automatically by appendSafeSpaceRules()

UPDATE system_prompts 
SET prompt_text = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(prompt_text, 
          'Always specify the aspect ratio in your prompt.', ''),
        '**ASPECT RATIO INTEGRATION:**
The aspect ratio will be provided in the request. Incorporate it naturally into your prompt by mentioning the orientation and composition that works best for that format. For example:
- For 16:9: "arranged in a wide landscape composition"
- For 9:16: "designed in a vertical portrait orientation" 
- For 1:1: "composed in a balanced square format"
- For 4:3: "structured in a classic rectangular layout"', ''),
      '**CRITICAL FORMATTING RULES:**
- DO NOT include any title, headline, or text overlays in the generated image
- DO NOT add "**Aspect Ratio:**" labels or formatting to your output
- Include the aspect ratio naturally within the prompt description (e.g., "in a 16:9 landscape format" or "designed for 9:16 vertical orientation")
- Focus purely on the visual elements, composition, and professional aesthetic
- End the prompt with a period, no additional formatting or labels', ''),
    'Generate professional, high-quality visual prompts that seamlessly integrate the specified aspect ratio without adding formatting labels or hardcoded text.', ''),
  'ASPECT RATIO INTEGRATION:', 'COMPOSITION GUIDELINES:'
)
WHERE agent_name = 'Visual Prompt Generator' 
AND is_active = true 
AND prompt_text ILIKE '%aspect ratio%';

-- Clean up any double spaces or newlines left by the replacements
UPDATE system_prompts 
SET prompt_text = REGEXP_REPLACE(
  REGEXP_REPLACE(prompt_text, '\n\n+', E'\n\n', 'g'),
  '  +', ' ', 'g'
)
WHERE agent_name = 'Visual Prompt Generator' 
AND is_active = true;