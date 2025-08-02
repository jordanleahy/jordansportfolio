import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

// Constants
const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
  VISUAL_PROMPT_GENERATOR: 'Visual Prompt Generator',
  BLOG_CONTENT_GENERATOR: 'Blog Content Generator',
  COVER_LETTER_GENERATOR: 'Cover Letter Generator',
} as const;

// Target agent mapping for different categories
const CATEGORY_TO_TARGET_AGENT = {
  'vibe-coding': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'healthcare': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'contracts': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'design': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'coding ai': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'ai agents': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'product_manager': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'product_designer': AGENT_NAMES.VISUAL_PROMPT_GENERATOR,
  'blog_content': AGENT_NAMES.BLOG_CONTENT_GENERATOR,
  'cover_letter': AGENT_NAMES.COVER_LETTER_GENERATOR,
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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
} as const;

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Color theme replacement function - enhanced to add color info if missing
function replaceColorThemeVariables(prompt: string, colorTheme: any): string {
  console.log('🎨 COLOR REPLACEMENT: Starting variable replacement');
  console.log('🔍 INPUT THEME:', {
    name: colorTheme.name,
    primary: colorTheme.primary_color,
    secondary: colorTheme.secondary_color,
    accent: colorTheme.accent_color
  });
  
  let updatedPrompt = prompt;
  let changesMade = false;
  
  // Simple bullet-point color palette format
  const newColorPalette = `## 🌈 Color Palette
- Primary: ${colorTheme.primary_color}
- Secondary: ${colorTheme.secondary_color}
- Accent: ${colorTheme.accent_color}
- Supporting: ${colorTheme.text_color}
- Background: ${colorTheme.background_color}
- Border: ${colorTheme.border_color}

**Theme**: ${colorTheme.name}

`;

  // Find and replace existing color palette section (both table and bullet formats)
  const colorSectionRegex = /## 🌈 Color Palette[\s\S]*?(?=##|$)/;
  if (colorSectionRegex.test(updatedPrompt)) {
    updatedPrompt = updatedPrompt.replace(colorSectionRegex, newColorPalette);
    console.log('✅ COLOR PALETTE: Replaced existing color palette section');
    changesMade = true;
  } else {
    // Add color palette section if none exists - insert after any existing ## section
    const afterHeaderRegex = /(##[^#].*?\n)/;
    if (afterHeaderRegex.test(updatedPrompt)) {
      updatedPrompt = updatedPrompt.replace(afterHeaderRegex, `$1\n${newColorPalette}`);
      console.log('✅ COLOR PALETTE: Added new color palette section');
      changesMade = true;
    } else {
      // If no headers exist, prepend the color palette
      updatedPrompt = newColorPalette + updatedPrompt;
      console.log('✅ COLOR PALETTE: Prepended color palette to prompt');
      changesMade = true;
    }
  }
  
  // Replace color instructions references
  const colorInstructionsRegex = /(Color Instructions|color instructions):\s*[^\n]*/gi;
  if (colorInstructionsRegex.test(updatedPrompt)) {
    updatedPrompt = updatedPrompt.replace(colorInstructionsRegex, `Color Instructions: ${colorTheme.color_instructions}`);
    console.log('✅ COLOR INSTRUCTIONS: Updated color instructions');
    changesMade = true;
  }
  
  // Replace visual style references
  const visualStyleRegex = /(Visual Style|visual style):\s*[^\n]*/gi;
  if (visualStyleRegex.test(updatedPrompt)) {
    updatedPrompt = updatedPrompt.replace(visualStyleRegex, `Visual Style: ${colorTheme.visual_style}`);
    console.log('✅ VISUAL STYLE: Updated visual style');
    changesMade = true;
  }
  
  // Replace theme name references - be more aggressive about theme name updates
  const themeNamePatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+theme/gi,
    /([A-Z][a-z]+(?:\s+&\s+[A-Z][a-z]+)*)\s+color/gi,
    /(Default|Professional|Standard|Basic)\s+(theme|color)/gi
  ];
  
  themeNamePatterns.forEach(pattern => {
    if (pattern.test(updatedPrompt)) {
      updatedPrompt = updatedPrompt.replace(pattern, `${colorTheme.name} theme`);
      changesMade = true;
    }
  });
  console.log('✅ THEME NAME: Updated theme name references');
  
  // Replace hex color codes with new ones - more comprehensive matching
  const hexPatterns = [
    { old: /#2563eb/gi, new: colorTheme.primary_color },
    { old: /#0891b2/gi, new: colorTheme.secondary_color },
    { old: /#16a34a/gi, new: colorTheme.accent_color },
    { old: /#64748b/gi, new: colorTheme.text_color },
    { old: /#f8fafc/gi, new: colorTheme.background_color },
    { old: /#e5e7eb/gi, new: colorTheme.border_color },
    { old: /#1e40af/gi, new: colorTheme.primary_color },
    { old: /#0e7490/gi, new: colorTheme.secondary_color },
    { old: /#ea580c/gi, new: colorTheme.accent_color }
  ];
  
  hexPatterns.forEach(({ old, new: newColor }) => {
    if (old.test(updatedPrompt)) {
      updatedPrompt = updatedPrompt.replace(old, newColor);
      console.log(`✅ HEX REPLACEMENT: ${old.source} → ${newColor}`);
      changesMade = true;
    }
  });
  
  // Force an update by adding theme signature if no other changes made
  if (!changesMade) {
    // Add a subtle theme signature to force an update
    const themeSignature = `\n\n<!-- Theme: ${colorTheme.name} (${new Date().toISOString()}) -->`;
    updatedPrompt += themeSignature;
    changesMade = true;
    console.log('🔄 FORCED UPDATE: Added theme signature to trigger update');
  }
  
  console.log('🎨 COLOR REPLACEMENT COMPLETE:', {
    original_length: prompt.length,
    updated_length: updatedPrompt.length,
    changes_made: changesMade
  });
  
  return updatedPrompt;
}

// Helper function to get a descriptive name from hex color
function getColorNameFromHex(hex: string): string {
  const colorMap: { [key: string]: string } = {
    '#000000': 'Pure Black',
    '#ffffff': 'Pure White',
    '#404040': 'Dark Gray',
    '#666666': 'Medium Gray',
    '#808080': 'Gray',
    '#cccccc': 'Light Gray',
    '#f0f0f0': 'Off White',
    '#2563eb': 'Professional Blue',
    '#0891b2': 'Trustworthy Teal',
    '#16a34a': 'Success Green',
    '#64748b': 'Clean Gray',
    '#f8fafc': 'Soft White',
    '#e5e7eb': 'Light Gray',
    '#1f2937': 'Charcoal',
    '#1e40af': 'Authority Navy',
    '#0e7490': 'Reliable Cyan',
    '#ea580c': 'Highlight Orange'
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

    // 🔍 ENHANCED LOGGING: Starting database operations
    console.log('📊 DATABASE OPERATIONS: Starting system prompt storage');
    console.log('🎯 TARGET DATA:', {
      user_id,
      agent_id: agent.id,
      agent_name: agent.name,
      category,
      prompt_length: generatedPrompt.length,
      timestamp: new Date().toISOString()
    });

    try {
      // 📝 Step 1: Save the generated prompt to system_prompts table
      console.log('💾 STEP 1: Attempting to insert into system_prompts table');
      const { data: insertedPrompt, error: insertError } = await supabase
        .from('system_prompts')
        .insert({
          user_id,
          agent_id: agent.id,
          agent_name: agent.name,
          agent_purpose: agent.purpose,
          agent_owner: agent.owner,
          name: `${category} System Prompt`,
          category,
          prompt_text: generatedPrompt,
          description: `Generated system prompt for ${category} category`
        })
        .select();

      if (insertError) {
        console.error('❌ SYSTEM_PROMPTS INSERT ERROR:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to save system prompt to database: ${insertError.message}`,
          details: insertError
        }), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ SYSTEM_PROMPTS INSERT SUCCESS:', {
        inserted_records: insertedPrompt?.length || 0,
        first_record_id: insertedPrompt?.[0]?.id,
        category: insertedPrompt?.[0]?.category
      });

      // 🎯 Step 2: Find the target agent and add prompt to its system_prompts array
      const targetAgentName = CATEGORY_TO_TARGET_AGENT[category as keyof typeof CATEGORY_TO_TARGET_AGENT];
      
      if (targetAgentName) {
        console.log(`🔍 STEP 2: Finding target agent "${targetAgentName}" for category "${category}"`);
        
        const { data: targetAgent, error: targetAgentError } = await supabase
          .from('openai_agents')
          .select('*')
          .eq('name', targetAgentName)
          .eq('user_id', user_id)
          .single();

        if (targetAgentError || !targetAgent) {
          console.error('❌ TARGET AGENT NOT FOUND:', {
            target_agent_name: targetAgentName,
            category,
            error: targetAgentError
          });
        } else {
          console.log('✅ TARGET AGENT FOUND:', {
            agent_name: targetAgent.name,
            agent_id: targetAgent.id
          });

          // Add the new prompt to the target agent's system_prompts array
          const existingPrompts = targetAgent.system_prompts || [];
          const newPromptObj = {
            category,
            prompt: generatedPrompt
          };

          // Check if a prompt for this category already exists
          const existingIndex = existingPrompts.findIndex((p: any) => p.category === category);
          let updatedPrompts;
          
          if (existingIndex >= 0) {
            // Replace existing prompt
            updatedPrompts = [...existingPrompts];
            updatedPrompts[existingIndex] = newPromptObj;
            console.log(`🔄 REPLACING: Existing prompt for category "${category}"`);
          } else {
            // Add new prompt
            updatedPrompts = [...existingPrompts, newPromptObj];
            console.log(`➕ ADDING: New prompt for category "${category}"`);
          }

          // Update the target agent with the new prompt
          const currentTimestamp = new Date().toISOString();
          const { error: targetUpdateError } = await supabase
            .from('openai_agents')
            .update({ 
              system_prompts: updatedPrompts,
              last_run: currentTimestamp,
              updated_at: currentTimestamp
            })
            .eq('id', targetAgent.id);

          if (targetUpdateError) {
            console.error('❌ TARGET AGENT UPDATE ERROR:', targetUpdateError);
          } else {
            console.log('✅ TARGET AGENT UPDATED: Successfully added prompt to target agent');
          }

          // Also update the system_prompts table record to reflect the correct target agent
          const { error: promptUpdateError } = await supabase
            .from('system_prompts')
            .update({
              agent_id: targetAgent.id,
              agent_name: targetAgent.name,
              agent_purpose: targetAgent.purpose,
              agent_owner: targetAgent.owner
            })
            .eq('id', insertedPrompt[0].id);

          if (promptUpdateError) {
            console.error('❌ PROMPT RECORD UPDATE ERROR:', promptUpdateError);
          } else {
            console.log('✅ PROMPT RECORD UPDATED: System prompt attribution updated');
          }
        }
      } else {
        console.log(`⚠️  NO TARGET MAPPING: No target agent defined for category "${category}"`);
      }

      // 🔄 Step 3: Update the generator agent's last_run timestamp
      console.log('⏰ STEP 3: Updating generator agent last_run timestamp');
      const currentTimestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('openai_agents')
        .update({ 
          last_run: currentTimestamp,
          updated_at: currentTimestamp
        })
        .eq('id', agent.id);

      if (updateError) {
        console.error('⚠️  AGENT UPDATE WARNING:', {
          error: updateError,
          message: updateError.message,
          agent_id: agent.id
        });
        // Non-critical error, continue
      } else {
        console.log('✅ AGENT UPDATE SUCCESS: Updated last_run timestamp');
      }

      // 🎉 Final success response
      console.log('🎉 OPERATION COMPLETE: System prompt generated and stored successfully');
      console.log('📈 FINAL STATS:', {
        operation: 'system_prompt_generation',
        user_id,
        category,
        agent_id: agent.id,
        prompt_length: generatedPrompt.length,
        database_records_created: insertedPrompt?.length || 0,
        success: true,
        timestamp: currentTimestamp
      });

      return new Response(JSON.stringify({ 
        success: true, 
        system_prompt: generatedPrompt,
        agent_id: agent.id,
        category,
        database_record_id: insertedPrompt?.[0]?.id,
        message: `System prompt for "${category}" generated and saved successfully`
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });

    } catch (dbError) {
      console.error('💥 DATABASE OPERATION FAILED:', {
        error: dbError,
        message: dbError.message,
        stack: dbError.stack,
        user_id,
        category,
        agent_id: agent.id
      });

      return new Response(JSON.stringify({ 
        success: false, 
        error: `Database operation failed: ${dbError.message}`,
        category,
        agent_id: agent.id
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
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