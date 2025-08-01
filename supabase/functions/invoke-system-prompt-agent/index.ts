import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

// Constants
const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
} as const;

const SYSTEM_PROMPT_CATEGORIES = {
  SYSTEM_PROMPT_GENERATION: 'system_prompt_generation',
} as const;

const OPENAI_CONFIG = {
  DEFAULT_TEMPERATURE: 0.1,
  DEFAULT_MODEL: 'gpt-4o-mini',
} as const;

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const ERROR_MESSAGES = {
  OPENAI_API_KEY_MISSING: 'OpenAI API key not configured',
  AGENT_NOT_FOUND: 'Required agent not found for this user',
  SYSTEM_PROMPT_NOT_FOUND: 'No system prompt found for specified category',
  INVALID_REQUEST_BODY: 'Invalid request body',
  OPENAI_API_ERROR: 'OpenAI API error',
} as const;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Color theme replacement function
function replaceColorThemeVariables(prompt: string, colorTheme: any): string {
  console.log('🎨 COLOR REPLACEMENT: Starting variable replacement');
  console.log('🔍 INPUT THEME:', {
    name: colorTheme.name,
    primary: colorTheme.primary_color,
    secondary: colorTheme.secondary_color,
    accent: colorTheme.accent_color
  });
  
  let updatedPrompt = prompt;
  
  // Find and replace the color palette table
  const colorTableRegex = /\|[^|]*Primary[^|]*\|[^|]*Secondary[^|]*\|[^|]*Accent[^|]*\|[^|]*(?:Neutral|Supporting)[^|]*\|\s*\n\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*\n\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*\n\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|/g;
  
  const newColorTable = `| Primary | Secondary | Accent | Supporting |
|---------|-----------|---------|----------|
| ${getColorNameFromHex(colorTheme.primary_color)} (${colorTheme.primary_color}) | ${getColorNameFromHex(colorTheme.secondary_color)} (${colorTheme.secondary_color}) | ${getColorNameFromHex(colorTheme.accent_color)} (${colorTheme.accent_color}) | ${getColorNameFromHex(colorTheme.text_color)} (${colorTheme.text_color}) |
| ${getColorNameFromHex(colorTheme.background_color)} (${colorTheme.background_color}) | ${getColorNameFromHex(colorTheme.border_color)} (${colorTheme.border_color}) | ${colorTheme.name} Theme | Clean Layout |`;
  
  if (colorTableRegex.test(updatedPrompt)) {
    updatedPrompt = updatedPrompt.replace(colorTableRegex, newColorTable);
    console.log('✅ COLOR TABLE: Replaced color palette table');
  } else {
    console.log('⚠️  COLOR TABLE: No color table found to replace');
  }
  
  // Replace color instructions references
  const colorInstructionsRegex = /(Color Instructions|color instructions|Visual Style):\s*[^\n]*/gi;
  if (colorInstructionsRegex.test(updatedPrompt)) {
    updatedPrompt = updatedPrompt.replace(colorInstructionsRegex, `Color Instructions: ${colorTheme.color_instructions}`);
    console.log('✅ COLOR INSTRUCTIONS: Updated color instructions');
  }
  
  // Replace visual style references
  const visualStyleRegex = /(Visual Style|visual style):\s*[^\n]*/gi;
  if (visualStyleRegex.test(updatedPrompt)) {
    updatedPrompt = updatedPrompt.replace(visualStyleRegex, `Visual Style: ${colorTheme.visual_style}`);
    console.log('✅ VISUAL STYLE: Updated visual style');
  }
  
  // Replace theme name references
  const themeNameRegex = /([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+|[A-Z][a-z]+\s+[A-Z][a-z]+)\s+theme/gi;
  updatedPrompt = updatedPrompt.replace(themeNameRegex, `${colorTheme.name} theme`);
  console.log('✅ THEME NAME: Updated theme name references');
  
  // Replace hex color codes with new ones
  const hexPatterns = [
    { old: /#2563eb/gi, new: colorTheme.primary_color },
    { old: /#0891b2/gi, new: colorTheme.secondary_color },
    { old: /#16a34a/gi, new: colorTheme.accent_color },
    { old: /#64748b/gi, new: colorTheme.text_color },
    { old: /#f8fafc/gi, new: colorTheme.background_color },
    { old: /#e5e7eb/gi, new: colorTheme.border_color }
  ];
  
  hexPatterns.forEach(({ old, new: newColor }) => {
    if (old.test(updatedPrompt)) {
      updatedPrompt = updatedPrompt.replace(old, newColor);
      console.log(`✅ HEX REPLACEMENT: ${old.source} → ${newColor}`);
    }
  });
  
  console.log('🎨 COLOR REPLACEMENT COMPLETE:', {
    original_length: prompt.length,
    updated_length: updatedPrompt.length,
    changes_made: prompt !== updatedPrompt
  });
  
  return updatedPrompt;
}

// Helper function to get a descriptive name from hex color
function getColorNameFromHex(hex: string): string {
  const colorMap: { [key: string]: string } = {
    '#000000': 'Black',
    '#ffffff': 'White',
    '#2563eb': 'Professional Blue',
    '#0891b2': 'Trustworthy Teal',
    '#16a34a': 'Success Green',
    '#64748b': 'Clean Gray',
    '#f8fafc': 'Soft White',
    '#e5e7eb': 'Light Gray',
    '#1f2937': 'Dark Gray'
  };
  
  return colorMap[hex.toLowerCase()] || 'Custom Color';
}

serve(async (req) => {
  console.log('invoke-system-prompt-agent function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const requestBody = await req.json();
    const { category, theme, description, sample_posts, user_id, color_theme } = requestBody;
    
    // Input validation
    if (!category || !user_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.INVALID_REQUEST_BODY 
      }), {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Processing request for category:', category, 'user_id:', user_id);

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.OPENAI_API_KEY_MISSING 
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

// Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🎨 THEME UPDATE: Starting variable-based color replacement');
    console.log('📝 INPUT DATA:', {
      category,
      user_id,
      has_color_theme: !!color_theme,
      theme_name: color_theme?.name,
      theme_colors: color_theme ? {
        primary: color_theme.primary_color,
        secondary: color_theme.secondary_color,
        accent: color_theme.accent_color
      } : null
    });

    // If color_theme is provided, do variable-based replacement
    if (color_theme) {
      console.log('🔄 REPLACEMENT MODE: Using targeted color replacement instead of full regeneration');
      
      // Get all agents with system prompts that might need updating
      const { data: agents, error: agentsError } = await supabase
        .from('openai_agents')
        .select('*')
        .eq('user_id', user_id)
        .not('system_prompts', 'is', null);

      if (agentsError) {
        console.error('❌ ERROR: Failed to fetch agents:', agentsError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch agents for color theme update' 
        }), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      console.log(`🔍 AGENTS FOUND: ${agents?.length || 0} agents with system prompts`);

      // Find agents that have prompts for the specified category
      const updatedAgents = [];
      
      for (const agent of agents || []) {
        const systemPrompts = agent.system_prompts || [];
        let hasUpdates = false;
        
        const updatedPrompts = systemPrompts.map((promptObj: any) => {
          if (promptObj.category === category) {
            console.log(`🎯 UPDATING: Agent "${agent.name}" prompt for category "${category}"`);
            
            const originalPrompt = promptObj.prompt;
            const updatedPrompt = replaceColorThemeVariables(originalPrompt, color_theme);
            
            console.log('📊 REPLACEMENT STATS:', {
              agent_name: agent.name,
              category: promptObj.category,
              original_length: originalPrompt.length,
              updated_length: updatedPrompt.length,
              has_changes: originalPrompt !== updatedPrompt
            });
            
            if (originalPrompt !== updatedPrompt) {
              hasUpdates = true;
              console.log('✅ COLOR REPLACEMENT: Successfully updated colors in system prompt');
            } else {
              console.log('⚠️  NO CHANGES: No color palette found to replace in this prompt');
            }
            
            return {
              ...promptObj,
              prompt: updatedPrompt
            };
          }
          return promptObj;
        });

        if (hasUpdates) {
          // Update the agent with the new system prompts
          const { error: updateError } = await supabase
            .from('openai_agents')
            .update({ 
              system_prompts: updatedPrompts,
              last_run: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', agent.id);

          if (updateError) {
            console.error('❌ DATABASE UPDATE ERROR:', updateError);
          } else {
            console.log(`✅ DATABASE UPDATE: Successfully updated agent "${agent.name}"`);
            updatedAgents.push(agent.name);
          }
        }
      }

      console.log('🎉 THEME UPDATE COMPLETE:', {
        total_agents_checked: agents?.length || 0,
        agents_updated: updatedAgents.length,
        updated_agent_names: updatedAgents,
        theme_applied: color_theme.name
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Color theme "${color_theme.name}" applied successfully`,
        agents_updated: updatedAgents.length,
        updated_agents: updatedAgents,
        category: category
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Original OpenAI generation logic (for non-color-theme updates)
    console.log('🤖 AI GENERATION MODE: Using OpenAI for full prompt generation');
    
    // Get the System Prompt Generator agent for this user
    const { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('*')
      .eq('name', AGENT_NAMES.SYSTEM_PROMPT_GENERATOR)
      .eq('user_id', user_id)
      .single();

    if (agentError || !agent) {
      console.error('System Prompt Generator agent not found:', agentError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.AGENT_NOT_FOUND 
      }), {
        status: HTTP_STATUS.NOT_FOUND,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found System Prompt Generator agent:', agent.id);

    // Get the system prompt for this agent
    const systemPrompts = agent.system_prompts || [];
    const systemPromptObj = systemPrompts.find((p: any) => p.category === SYSTEM_PROMPT_CATEGORIES.SYSTEM_PROMPT_GENERATION);
    
    if (!systemPromptObj) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.SYSTEM_PROMPT_NOT_FOUND 
      }), {
        status: HTTP_STATUS.NOT_FOUND,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = systemPromptObj.prompt;

    // Prepare the user prompt with the category and context
    let userPrompt = `Create a comprehensive system prompt for the "${category}" category.

Theme: ${theme || 'General'}
Description: ${description || 'No description provided'}

Sample content from this category:
${sample_posts?.map((post: any) => `- ${post.title}: ${post.description}`).join('\n') || 'No sample posts provided'}

Please generate a detailed, professional system prompt following the established template format with industry-specific visual frameworks, color palettes, and content analysis guidelines.`;

    console.log('Calling OpenAI with system prompt length:', systemPrompt.length);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model_version || OPENAI_CONFIG.DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: OPENAI_CONFIG.DEFAULT_TEMPERATURE,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `${ERROR_MESSAGES.OPENAI_API_ERROR}: ${response.status}` 
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    console.log('Generated system prompt length:', generatedPrompt.length);

    // Update the agent's last_run timestamp
    const currentTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('openai_agents')
      .update({ 
        last_run: currentTimestamp,
        updated_at: currentTimestamp
      })
      .eq('id', agent.id);

    if (updateError) {
      console.error('Error updating agent last_run:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      system_prompt: generatedPrompt,
      agent_id: agent.id
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in invoke-system-prompt-agent function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});