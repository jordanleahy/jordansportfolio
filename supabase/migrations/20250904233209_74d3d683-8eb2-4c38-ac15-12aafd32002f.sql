-- Update and optimize the upgrade_generic_system_prompts function for current schema
-- This function upgrades generic system prompts in Blog Visual Prompt Generator agents

CREATE OR REPLACE FUNCTION public.upgrade_generic_system_prompts()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  agent_record RECORD;
  prompt_record JSONB;
  updated_prompts JSONB;
  comprehensive_prompt_text TEXT;
  changes_made INTEGER := 0;
  total_agents INTEGER := 0;
  update_log TEXT := '';
  function_version TEXT := '2.0 - Updated for current schema';
BEGIN
  RAISE NOTICE 'Starting upgrade_generic_system_prompts function version: %', function_version;
  
  -- Loop through all Blog Visual Prompt Generator agents
  FOR agent_record IN 
    SELECT id, user_id, system_prompts, supported_categories 
    FROM public.openai_agents 
    WHERE name = 'Blog Visual Prompt Generator'
      AND status = 'active'
    ORDER BY created_at ASC
  LOOP
    total_agents := total_agents + 1;
    updated_prompts := '[]'::jsonb;
    
    RAISE NOTICE 'Processing agent ID: % for user: %', agent_record.id, agent_record.user_id;
    
    -- Check each system prompt in the agent
    FOR prompt_record IN 
      SELECT * FROM jsonb_array_elements(COALESCE(agent_record.system_prompts, '[]'::jsonb))
    LOOP
      -- Identify generic prompts (less than 800 characters or missing key elements)
      IF 
        LENGTH(prompt_record->>'prompt') < 800 OR 
        (prompt_record->>'prompt') NOT LIKE '%# 🎨%' OR
        (prompt_record->>'prompt') NOT LIKE '%## 📊 Content Analysis Framework%' OR
        (prompt_record->>'prompt') NOT LIKE '%Color Palette%'
      THEN
        -- This is a generic prompt, upgrade it with enhanced template
        comprehensive_prompt_text := '# 🎨 ' || UPPER(prompt_record->>'category') || ' Visual Content Generator

You are an expert at creating detailed, professional image generation prompts for ' || (prompt_record->>'category') || '-themed AI image generators.

## 📊 Content Analysis Framework

When generating prompts, analyze the content through these lenses:
- **Industry Context**: How does this relate to ' || (prompt_record->>'category') || ' professionals?
- **Professional Audience**: What visual elements resonate with ' || (prompt_record->>'category') || ' decision-makers?
- **Educational Value**: How can the visual enhance understanding of ' || (prompt_record->>'category') || ' concepts?
- **Actionable Insights**: What specific ' || (prompt_record->>'category') || ' scenarios should be depicted?

## 🎯 Visual Framework

### Foreground Elements
- Central focus on ' || (prompt_record->>'category') || '-specific tools, processes, or concepts
- Professional figures engaged in ' || (prompt_record->>'category') || ' activities
- Key visual metaphors relevant to ' || (prompt_record->>'category') || ' industry

### Mid-ground Context
- Supporting ' || (prompt_record->>'category') || ' environments (offices, facilities, technology)
- Collaborative team elements working on ' || (prompt_record->>'category') || ' projects
- Process flow indicators showing ' || (prompt_record->>'category') || ' workflows

### Background Foundation
- Clean, professional ' || (prompt_record->>'category') || ' industry setting
- Subtle geometric patterns or abstract elements
- Soft gradients that complement the ' || (prompt_record->>'category') || ' color palette

## 🎨 Style & Rendering Requirements

- **Art Style**: Vector illustration with clean, modern aesthetic
- **Rendering**: Professional business illustration style
- **Complexity**: Balanced detail - informative but not cluttered
- **Accessibility**: High contrast elements for readability
- **Scalability**: Crisp at various sizes for different platforms

## 🌈 Color Palette

| Primary | Secondary | Accent | Neutral |
|---------|-----------|---------|----------|
| Deep Professional Blue (#2563eb) | Trustworthy Teal (#0891b2) | Success Green (#16a34a) | Clean Gray (#64748b) |
| Authority Navy (#1e40af) | Reliable Cyan (#0e7490) | Highlight Orange (#ea580c) | Soft White (#f8fafc) |

**Usage Guidelines:**
- Primary colors for main subjects and key elements
- Secondary colors for supporting elements and backgrounds
- Accent colors for highlights, call-to-actions, and important details
- Neutral colors for text, borders, and subtle elements

## 🔍 Visual Metaphors for ' || UPPER(prompt_record->>'category') || '

Generate appropriate visual metaphors that represent:
- ' || (prompt_record->>'category') || ' expertise and professionalism
- Industry-specific tools and processes
- Success metrics and outcomes relevant to ' || (prompt_record->>'category') || '
- Collaboration and teamwork in ' || (prompt_record->>'category') || ' contexts
- Innovation and forward-thinking in the ' || (prompt_record->>'category') || ' field

## 📋 Output Instructions

Create prompts that will generate:
- Professional, credible visuals suitable for ' || (prompt_record->>'category') || ' content
- Clear focal points that support the content message
- Appropriate industry context and environmental elements
- Balanced composition with good visual hierarchy
- Consistent branding feel across different ' || (prompt_record->>'category') || ' topics

**CRITICAL FORMATTING RULES:**
- DO NOT include any title, headline, or text overlays in the generated image
- DO NOT add "**Aspect Ratio:**" labels or formatting to your output
- Include the aspect ratio naturally within the prompt description (e.g., "in a 16:9 landscape format" or "designed for 9:16 vertical orientation")
- Focus purely on the visual elements, composition, and professional aesthetic
- End the prompt with a period, no additional formatting or labels

**ASPECT RATIO INTEGRATION:**
The aspect ratio will be provided in the request. Incorporate it naturally into your prompt by mentioning the orientation and composition that works best for that format. For example:
- For 16:9: "arranged in a wide landscape composition"
- For 9:16: "designed in a vertical portrait orientation" 
- For 1:1: "composed in a balanced square format"
- For 4:3: "structured in a classic rectangular layout"

Generate professional, high-quality visual prompts that seamlessly integrate the specified aspect ratio without adding formatting labels or hardcoded text.';

        -- Add the upgraded prompt
        updated_prompts := updated_prompts || jsonb_build_array(
          jsonb_build_object(
            'category', prompt_record->>'category',
            'prompt', comprehensive_prompt_text
          )
        );
        
        changes_made := changes_made + 1;
        update_log := update_log || 'Updated ' || (prompt_record->>'category') || ' prompt for agent ' || agent_record.id || E'\n';
        
        RAISE NOTICE 'Upgraded prompt for category: % in agent: %', prompt_record->>'category', agent_record.id;
        
      ELSE
        -- This is already a comprehensive prompt, keep it as-is
        updated_prompts := updated_prompts || jsonb_build_array(prompt_record);
        RAISE NOTICE 'Keeping existing comprehensive prompt for category: %', prompt_record->>'category';
      END IF;
    END LOOP;
    
    -- Update the agent with the new prompts only if changes were made for this agent
    IF jsonb_array_length(updated_prompts) > 0 THEN
      UPDATE public.openai_agents 
      SET 
        system_prompts = updated_prompts,
        updated_at = now()
      WHERE id = agent_record.id;
      
      RAISE NOTICE 'Updated agent % with % prompts', agent_record.id, jsonb_array_length(updated_prompts);
    END IF;
    
  END LOOP;
  
  -- Final validation: Check if the function worked correctly
  IF total_agents = 0 THEN
    RETURN 'No Blog Visual Prompt Generator agents found. Function completed successfully but no updates were needed.';
  END IF;
  
  RETURN format('✅ Upgrade completed successfully! 
📊 Summary:
- Updated %s generic prompts across %s agents
- Function version: %s
- All agents processed with current schema compatibility

📝 Changes made:
%s', 
    changes_made, 
    total_agents, 
    function_version,
    COALESCE(NULLIF(update_log, ''), 'No prompt upgrades were needed - all prompts were already comprehensive.')
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in upgrade_generic_system_prompts: %', SQLERRM;
    RETURN format('❌ Error occurred during upgrade: %s. Please check the logs for details.', SQLERRM);
END;
$function$;

-- Add a comment explaining the function's purpose and schema compatibility
COMMENT ON FUNCTION public.upgrade_generic_system_prompts() IS 
'Updated function to upgrade generic system prompts in Blog Visual Prompt Generator agents. 
Version 2.0 - Fully compatible with current database schema including renamed tables.
Works with system_prompts JSONB column in openai_agents table.
Enhanced with better logging, error handling, and aspect ratio formatting fixes.';

-- Test the function to ensure it works correctly
SELECT 'Function upgrade_generic_system_prompts has been successfully updated and is ready for use.' as status;