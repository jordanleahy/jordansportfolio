-- Function to upgrade generic system prompts to comprehensive CDI-style format
CREATE OR REPLACE FUNCTION upgrade_generic_system_prompts()
RETURNS TEXT AS $$
DECLARE
  agent_record RECORD;
  prompt_record JSONB;
  updated_prompts JSONB;
  comprehensive_prompt_text TEXT;
  changes_made INTEGER := 0;
  total_agents INTEGER := 0;
  update_log TEXT := '';
BEGIN
  -- Loop through all Blog Visual Prompt Generator agents
  FOR agent_record IN 
    SELECT id, user_id, system_prompts, supported_categories 
    FROM openai_agents 
    WHERE name = 'Blog Visual Prompt Generator'
  LOOP
    total_agents := total_agents + 1;
    updated_prompts := '[]'::jsonb;
    
    -- Check each system prompt in the agent
    FOR prompt_record IN 
      SELECT * FROM jsonb_array_elements(COALESCE(agent_record.system_prompts, '[]'::jsonb))
    LOOP
      -- Identify generic prompts (less than 800 characters or missing key CDI elements)
      IF 
        LENGTH(prompt_record->>'prompt') < 800 OR 
        (prompt_record->>'prompt') NOT LIKE '%# 🎨%' OR
        (prompt_record->>'prompt') NOT LIKE '%## 📊 Content Analysis Framework%' OR
        (prompt_record->>'prompt') NOT LIKE '%Color Palette%'
      THEN
        -- This is a generic prompt, upgrade it
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

**CRITICAL**: Do not include any title, headline, or text overlays in the generated image. Focus purely on the visual elements, composition, and professional aesthetic.

Always specify the exact aspect ratio in your prompt (e.g., "16:9 aspect ratio") and ensure the generated prompt will create appropriate, high-quality professional visuals for ' || (prompt_record->>'category') || ' industry content.';

        -- Add the upgraded prompt
        updated_prompts := updated_prompts || jsonb_build_array(
          jsonb_build_object(
            'category', prompt_record->>'category',
            'prompt', comprehensive_prompt_text
          )
        );
        
        changes_made := changes_made + 1;
        update_log := update_log || 'Updated ' || (prompt_record->>'category') || ' prompt for agent ' || agent_record.id || E'\n';
        
      ELSE
        -- This is already a comprehensive prompt, keep it as-is
        updated_prompts := updated_prompts || jsonb_build_array(prompt_record);
      END IF;
    END LOOP;
    
    -- Update the agent with the new prompts
    UPDATE openai_agents 
    SET 
      system_prompts = updated_prompts,
      updated_at = now()
    WHERE id = agent_record.id;
    
  END LOOP;
  
  RETURN format('Upgrade completed! Updated %s generic prompts across %s agents.%s%s', 
    changes_made, total_agents, E'\n\nChanges made:\n', update_log);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the upgrade function
SELECT upgrade_generic_system_prompts();